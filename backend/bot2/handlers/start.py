"""
Bot 2 — /start handler (Mijoz boti).
Har bir restoran uchun alohida bot, lekin bir xil shablon.
"""
import os
import logging
from aiogram import Router, types, F
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy.future import select

from database import async_session
from models import Restaurant, User, UserLanguage

logger = logging.getLogger(__name__)


def get_start_router(restaurant_id: int) -> Router:
    router = Router()

    @router.message(CommandStart())
    async def cmd_start(message: types.Message, state: FSMContext):
        await state.clear()

        async with async_session() as session:
            rest_r = await session.execute(
                select(Restaurant).where(Restaurant.id == restaurant_id)
            )
            restaurant = rest_r.scalar_one_or_none()

            if not restaurant or not restaurant.is_active:
                await message.answer("⏸ Bot hozirda ishlamaydi. Iltimos, keyinroq kiring.")
                return

            # Mijozni ro'yxatdan o'tkazish yoki yangilash
            user_r = await session.execute(
                select(User).where(User.telegram_id == message.from_user.id)
            )
            user = user_r.scalar_one_or_none()

            if not user:
                # Til aniqlash
                tg_lang = (message.from_user.language_code or "uz").lower()
                if tg_lang.startswith("ru"):
                    lang = UserLanguage.ru
                elif tg_lang.startswith("en"):
                    lang = UserLanguage.en
                else:
                    lang = UserLanguage.uz

                user = User(
                    telegram_id   = message.from_user.id,
                    full_name     = message.from_user.full_name,
                    restaurant_id = restaurant_id,
                    language      = lang,
                )
                session.add(user)
                await session.commit()

        # Mini App URL
        mini_app_url = os.getenv("MINI_APP_URL", "")

        is_owner = (message.from_user.id == restaurant.owner_id)

        if mini_app_url:
            customer_url = f"{mini_app_url}?restaurant_id={restaurant_id}"
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text="⚙️ Admin Panel" if is_owner else "🍽 Menyuni Ko'rish",
                    web_app=types.WebAppInfo(url=customer_url)
                )],
                [InlineKeyboardButton(
                    text="📦 Zakazlarim",
                    callback_data="my_orders"
                )],
            ])
        else:
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🍽 Menyuni Ko'rish", callback_data="show_menu")],
                [InlineKeyboardButton(text="📦 Zakazlarim",      callback_data="my_orders")],
            ])

        if is_owner:
            greeting = (
                f"🛡 <b>{restaurant.name} Boshqaruvi</b>\n\n"
                "Salom, Admin! Sizning botingiz tayyor.\n"
                "Pastdagi tugmani bosib, admin panelga kiring va sozlamalarni bajaring."
            )
        else:
            greeting = (
                f"🌿 <b>{restaurant.name}</b>\n\n"
                "Assalomu alaykum! 👋\n\n"
                "Menyuni ko'rish va zakaz berish uchun pastdagi tugmani bosing:"
            )

        if restaurant.logo_file_id and not is_owner:
            await message.answer_photo(
                restaurant.logo_file_id,
                caption=greeting,
                reply_markup=kb
            )
        else:
            await message.answer(greeting, reply_markup=kb)

    @router.callback_query(F.data == "my_orders")
    async def my_orders(callback: types.CallbackQuery):
        async with async_session() as session:
            from models import Order
            from sqlalchemy import desc
            orders_r = await session.execute(
                select(Order)
                .where(
                    Order.user_id == callback.from_user.id,
                    Order.restaurant_id == restaurant_id
                )
                .order_by(desc(Order.created_at))
                .limit(5)
            )
            orders = orders_r.scalars().all()

        if not orders:
            await callback.message.answer("📭 Sizda hali zakazlar yo'q.")
            await callback.answer()
            return

        STATUS_ICONS = {
            "new": "🆕", "confirmed": "✅", "paid": "💰",
            "cooking": "👨‍🍳", "delivery": "🚴", "done": "✔️", "cancelled": "❌"
        }
        text = "📦 <b>Oxirgi zakazlaringiz:</b>\n\n"
        for order in orders:
            icon = STATUS_ICONS.get(order.status.value, "•")
            text += (
                f"{icon} Zakaz #{order.id} — "
                f"<b>{float(order.total_amount):,.0f} so'm</b>\n"
                f"   Holat: {order.status.value}\n\n"
            )
        await callback.message.answer(text)
        await callback.answer()

    return router
