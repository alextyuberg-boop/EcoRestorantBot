"""
Bot 2 — Zakaz berish FSM handler (telefon, lokatsiya, to'lov).
Mini App web_app_data orqali cart ma'lumotlarini qabul qiladi,
yoki bot keyboard orqali (backup).
"""
import json
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
)
from sqlalchemy.future import select

from database import async_session
from models import Restaurant, User, Order, PaymentType, OrderStatus
from bot2.states import OrderStates

logger = logging.getLogger(__name__)


def get_order_router(restaurant_id: int) -> Router:
    router = Router()

    # ── Mini App'dan cart data kelishi ──────────────────────────────────

    @router.message(F.web_app_data)
    async def handle_webapp_data(message: types.Message, state: FSMContext):
        """Mini App 'Zakaz berish' tugmasini bosganida keladi."""
        try:
            data = json.loads(message.web_app_data.data)
            cart = data.get("cart", [])
            total = data.get("total", 0)
        except Exception:
            await message.answer("❌ Ma'lumot xatosi. Qayta urinib ko'ring.")
            return

        if not cart:
            await message.answer("🛒 Savat bo'sh!")
            return

        # Cart'ni FSM'ga saqlash
        await state.update_data(cart=cart, total=total, restaurant_id=restaurant_id)

        cart_text = "\n".join(
            f"  • {item['name']} × {item['qty']} — {float(item['price']):,.0f} so'm"
            for item in cart
        )

        await message.answer(
            f"✅ <b>Zakar tasdiqlandi:</b>\n\n{cart_text}\n\n"
            f"💰 Jami: <b>{float(total):,.0f} so'm</b>\n\n"
            "📞 Telefon raqamingizni yuboring:",
            reply_markup=ReplyKeyboardMarkup(
                keyboard=[[KeyboardButton(text="📞 Raqamni ulashish", request_contact=True)]],
                resize_keyboard=True, one_time_keyboard=True
            )
        )
        await state.set_state(OrderStates.phone)

    # ── Telefon ──────────────────────────────────────────────────────────

    @router.message(OrderStates.phone, F.contact)
    async def order_phone_contact(message: types.Message, state: FSMContext):
        await state.update_data(phone=message.contact.phone_number)
        await _ask_location(message)


    @router.message(OrderStates.phone, F.text)
    async def order_phone_text(message: types.Message, state: FSMContext):
        phone = message.text.strip()
        await state.update_data(phone=phone)
        await _ask_location(message)


    async def _ask_location(message: types.Message):
        await message.answer(
            "📍 Manzilni yuboring:",
            reply_markup=ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(text="📍 Lokatsiyamni ulashish", request_location=True)],
                    [KeyboardButton(text="✏️ Manzilni matn sifatida yozish")],
                ],
                resize_keyboard=True
            )
        )
        from aiogram.fsm.context import FSMContext as _C
        # State next is set in place below
        await message.bot.set_my_commands([])  # placeholder
        # Note: state set in parent scope


    @router.message(OrderStates.phone)  # Fallthrough to set location state
    async def set_location_state(message: types.Message, state: FSMContext):
        await state.set_state(OrderStates.location)


    @router.message(OrderStates.location, F.location)
    async def order_location(message: types.Message, state: FSMContext):
        await state.update_data(
            location_lat=message.location.latitude,
            location_lon=message.location.longitude
        )
        await _ask_payment(message, state)


    @router.message(OrderStates.location, F.text)
    async def order_location_text(message: types.Message, state: FSMContext):
        if message.text == "✏️ Manzilni matn sifatida yozish":
            await message.answer("Manzilni yozing:", reply_markup=ReplyKeyboardRemove())
            return
        await state.update_data(delivery_address=message.text.strip())
        await _ask_payment(message, state)


    async def _ask_payment(message: types.Message, state: FSMContext):
        data = await state.get_data()
        total = float(data.get("total", 0))

        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="💳 Online to'lov",      callback_data="pay_online"),
                InlineKeyboardButton(text="🚪 Yetkazishda to'lov", callback_data="pay_cash"),
            ]
        ])
        await message.answer(
            f"💰 Jami: <b>{total:,.0f} so'm</b>\n\nTo'lov usulini tanlang:",
            reply_markup=kb
        )
        await state.set_state(OrderStates.payment)


    # ── To'lov usuli ─────────────────────────────────────────────────────

    @router.callback_query(OrderStates.payment, F.data == "pay_cash")
    async def payment_cash(callback: types.CallbackQuery, state: FSMContext):
        await state.update_data(payment_type="cash")
        await _create_order(callback.message, state, callback.from_user.id)
        await callback.answer()


    @router.callback_query(OrderStates.payment, F.data == "pay_online")
    async def payment_online_choose(callback: types.CallbackQuery, state: FSMContext):
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="🔵 Payme",  callback_data="provider_payme"),
                InlineKeyboardButton(text="🟡 Click",  callback_data="provider_click"),
            ],
            [
                InlineKeyboardButton(text="🟣 Uzum",   callback_data="provider_uzum"),
                InlineKeyboardButton(text="🔷 Paynet", callback_data="provider_paynet"),
            ],
        ])
        await callback.message.edit_text("To'lov tizimini tanlang:", reply_markup=kb)
        await callback.answer()


    @router.callback_query(OrderStates.payment, F.data.startswith("provider_"))
    async def payment_provider(callback: types.CallbackQuery, state: FSMContext):
        provider = callback.data.split("_")[1]
        await state.update_data(payment_type=provider)
        await _create_order(callback.message, state, callback.from_user.id)
        await callback.answer()


    # ── Zakaz yaratish ────────────────────────────────────────────────────

    async def _create_order(message: types.Message, state: FSMContext, user_tg_id: int):
        data = await state.get_data()

        payment_str  = data.get("payment_type", "cash")
        try:
            payment_enum = PaymentType[payment_str]
        except KeyError:
            payment_enum = PaymentType.cash

        async with async_session() as session:
            order = Order(
                restaurant_id    = restaurant_id,
                user_id          = user_tg_id,
                status           = OrderStatus.new,
                items            = data.get("cart", []),
                total_amount     = data.get("total", 0),
                phone            = data.get("phone"),
                delivery_address = data.get("delivery_address"),
                location_lat     = data.get("location_lat"),
                location_lon     = data.get("location_lon"),
                payment_type     = payment_enum,
            )
            session.add(order)

            # Restoran egasini toping
            rest_r = await session.execute(
                select(Restaurant).where(Restaurant.id == restaurant_id)
            )
            restaurant = rest_r.scalar_one_or_none()
            await session.commit()
            await session.refresh(order)

        await state.clear()

        # Mijozga tasdiqlash
        await message.answer(
            f"🎉 <b>Zakazingiz qabul qilindi!</b>\n\n"
            f"📋 Zakaz #{order.id}\n"
            f"💰 Jami: <b>{float(order.total_amount):,.0f} so'm</b>\n"
            f"💳 To'lov: {payment_str.upper()}\n\n"
            "Restoran tasdiqlagach xabar yuboriladi.",
            reply_markup=ReplyKeyboardRemove()
        )

        # Egaga bildirishnoma
        if restaurant:
            try:
                from bot_manager import active_bots
                from bot_notifier import notify_owner_new_order
                # Platform bot orqali egaga xabar
                platform_token = __import__('os').getenv("PLATFORM_BOT_TOKEN", "")
                if platform_token in active_bots:
                    platform_bot = active_bots.get(platform_token)
                else:
                    from aiogram import Bot
                    platform_bot = Bot(token=platform_token)

                await notify_owner_new_order(
                    platform_bot,
                    restaurant.owner_id,
                    {
                        "id": order.id,
                        "items": data.get("cart", []),
                        "total_amount": float(order.total_amount),
                        "phone": data.get("phone"),
                        "delivery_address": data.get("delivery_address"),
                        "location_lat": data.get("location_lat"),
                        "location_lon": data.get("location_lon"),
                        "payment_type": payment_str,
                    }
                )
            except Exception as e:
                logger.warning(f"Egaga xabar yuborishda xato: {e}")

    return router
