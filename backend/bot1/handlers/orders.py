"""
Bot 1 — Zakaz ko'rish va boshqarish handler'lari.
Egalar aktiv zakazlarni ko'radi va statusini o'zgartiradi.
"""
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select
from sqlalchemy import desc

from database import async_session
from models import Order, OrderStatus, Restaurant, RestaurantOwner, User
from bot1.keyboards import order_status_keyboard

logger = logging.getLogger(__name__)
router = Router()


def _format_order(order: Order, user: User | None = None) -> str:
    """Zakaz kartasini matn sifatida formatlaydi."""
    items_text = "\n".join(
        f"  • {item.get('name', '?')} × {item.get('qty', 1)} — "
        f"{float(item.get('price', 0)):,.0f} so'm"
        for item in (order.items or [])
    )

    location_text = ""
    if order.location_lat:
        location_text = (
            f"\n📍 <a href='https://maps.google.com/?q="
            f"{order.location_lat},{order.location_lon}'>Xaritada ko'rish</a>"
        )
    elif order.delivery_address:
        location_text = f"\n📍 {order.delivery_address}"

    user_phone = order.phone or (user.phone if user else "—")
    payment = (order.payment_type.value if order.payment_type else "naqd").upper()

    return (
        f"📋 <b>Zakaz #{order.id}</b>\n"
        f"━━━━━━━━━━━━━━━\n"
        f"{items_text}\n"
        f"━━━━━━━━━━━━━━━\n"
        f"💰 Jami: <b>{float(order.total_amount):,.0f} so'm</b>\n"
        f"📞 {user_phone}"
        f"{location_text}\n"
        f"💳 {payment}"
    )


# ── Zakazlar tugmasi ──────────────────────────────────────────────────

@router.message(F.text.in_({"📦 Zakazlar", "📦 Заказы"}))
async def show_orders(message: types.Message, state: FSMContext):
    await state.clear()
    import os
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")

    await message.answer(
        "📦 <b>Buyurtmalar boshqaruvi</b>\n\n"
        "Aktiv buyurtmalarni real-vaqtda ko'rish, tasdiqlash, tayyorlash va kuryerga topshirish uchun **Kabinet (Mini App)**'ga kiring 👇",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(
                text="📱 Kabinetni ochish",
                web_app=types.WebAppInfo(url=mini_app_url)
            )]
        ])
    )


# ── Status o'zgartirish ───────────────────────────────────────────────

@router.callback_query(F.data.startswith("order_status_"))
async def change_order_status(callback: types.CallbackQuery):
    # order_status_{order_id}_{new_status}
    parts = callback.data.split("_")
    order_id   = int(parts[2])
    new_status = parts[3]

    try:
        new_status_enum = OrderStatus[new_status]
    except KeyError:
        await callback.answer("❌ Noto'g'ri status!", show_alert=True)
        return

    async with async_session() as session:
        result = await session.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            await callback.answer("❌ Zakaz topilmadi!", show_alert=True)
            return

        # Bekor qilish faqat 'new' holatida mumkin
        if new_status == "cancelled" and order.status != OrderStatus.new:
            await callback.answer(
                "❌ Faqat yangi zakazlarni bekor qilish mumkin!", show_alert=True
            )
            return

        old_status = order.status
        order.status = new_status_enum
        await session.commit()

        # Mijozga xabar yuborish (bot_manager dan bot olish)
        user_tg_id = order.user_id
        user_lang  = "uz"

    # Inline message'ni yangilash
    try:
        await callback.message.edit_reply_markup(
            reply_markup=order_status_keyboard(order_id, new_status)
        )
    except Exception:
        pass

    STATUS_LABELS = {
        "confirmed": "✅ Qabul qilindi",
        "cooking":   "👨‍🍳 Tayyorlanmoqda",
        "delivery":  "🚴 Yo'lda",
        "done":      "✔️ Yetkazildi",
        "cancelled": "❌ Bekor qilindi",
    }
    await callback.answer(
        f"Zakaz #{order_id}: {STATUS_LABELS.get(new_status, new_status)}",
        show_alert=False
    )

    # Mijozga bildirishnoma (agar bot mavjud bo'lsa)
    try:
        from bot_manager import active_bots
        from bot_notifier import notify_customer_status
        async with async_session() as session:
            order_r = await session.execute(select(Order).where(Order.id == order_id))
            order = order_r.scalar_one_or_none()
            if order:
                rest_r = await session.execute(
                    select(Restaurant).where(Restaurant.id == order.restaurant_id)
                )
                restaurant = rest_r.scalar_one_or_none()
                if restaurant and restaurant.bot_token in active_bots:
                    cust_bot = active_bots[restaurant.bot_token]
                    await notify_customer_status(
                        cust_bot, order.user_id, order.id, new_status
                    )
    except Exception as e:
        logger.warning(f"Mijozga xabar yuborishda xato: {e}")
