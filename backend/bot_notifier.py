"""
bot_notifier.py — Egalar va mijozlarga xabar yuboruvchi yordamchi modul.
Bu modul barcha bot notification xabarlarini markazlashtiradi.
"""
import logging
from aiogram import Bot
from aiogram.exceptions import TelegramAPIError

logger = logging.getLogger(__name__)


# ── Egaga zakaz xabari ─────────────────────────────────────────────────

async def notify_owner_new_order(
    platform_bot: Bot,
    owner_telegram_id: int,
    order: dict,
) -> bool:
    """
    Yangi zakaz kelganda restoran egasiga xabar yuboradi.
    platform_bot — @EcoRestaurant_Bot instance.
    """
    items_text = "\n".join(
        f"  • {item['name']} × {item['qty']} — {item['price']:,.0f} so'm"
        for item in order.get("items", [])
    )
    location_text = ""
    if order.get("location_lat"):
        location_text = (
            f"\n📍 <a href='https://maps.google.com/?q="
            f"{order['location_lat']},{order['location_lon']}'>Xaritada ko'rish</a>"
        )
    elif order.get("delivery_address"):
        location_text = f"\n📍 {order['delivery_address']}"

    no_phone = "Telefon yo'q"
    text = (
        f"🆕 <b>Yangi zakaz #{order['id']}</b>\n\n"
        f"{items_text}\n\n"
        f"💰 Jami: <b>{order['total_amount']:,.0f} so'm</b>\n"
        f"📞 {order.get('phone', no_phone)}"
        f"{location_text}\n"
        f"💳 To'lov: {order.get('payment_type', 'naqd').upper()}"
    )

    try:
        await platform_bot.send_message(owner_telegram_id, text)
        return True
    except TelegramAPIError as e:
        logger.error(f"Egaga xabar yuborish xatosi: {e}")
        return False


# ── Mijozga holat xabari ───────────────────────────────────────────────

STATUS_MESSAGES_UZ = {
    "confirmed":  "✅ <b>Zakazingiz tasdiqlandi!</b>\n\nZakaz #{id} tez orada tayyorlanadi.",
    "cooking":    "👨‍🍳 <b>Taomingiz tayyorlanmoqda!</b>\n\nBirozgina sabr qiling...",
    "delivery":   "🚴 <b>Kuryer yo'lda!</b>\n\nTez yetib boradi.",
    "done":       "✔️ <b>Zakaz yetkazildi!</b>\n\nRahmat! Yana keling 😊",
    "cancelled":  "❌ <b>Afsuski zakazingiz bekor qilindi.</b>\n\nIltimos, qayta urinib ko'ring.",
    "paid":       "✅ <b>To'lovingiz qabul qilindi!</b>\n\nZakaz tayyorlanmoqda.",
}

STATUS_MESSAGES_RU = {
    "confirmed":  "✅ <b>Ваш заказ подтверждён!</b>\n\nЗаказ #{id} скоро будет готов.",
    "cooking":    "👨‍🍳 <b>Ваш заказ готовится!</b>\n\nПожалуйста, подождите...",
    "delivery":   "🚴 <b>Курьер в пути!</b>\n\nСкоро доставим.",
    "done":       "✔️ <b>Заказ доставлен!</b>\n\nСпасибо! Приходите снова 😊",
    "cancelled":  "❌ <b>К сожалению, заказ отменён.</b>\n\nПожалуйста, попробуйте снова.",
    "paid":       "✅ <b>Оплата принята!</b>\n\nЗаказ готовится.",
}


async def notify_customer_status(
    customer_bot: Bot,
    user_telegram_id: int,
    order_id: int,
    status: str,
    lang: str = "uz",
) -> bool:
    """
    Zakaz holati o'zgarganda mijozga xabar yuboradi.
    customer_bot — restoran boti instance (active_bots dan olinadi).
    """
    messages = STATUS_MESSAGES_RU if lang == "ru" else STATUS_MESSAGES_UZ
    template = messages.get(status, "")
    if not template:
        return False

    text = template.format(id=order_id)

    try:
        await customer_bot.send_message(user_telegram_id, text)
        return True
    except TelegramAPIError as e:
        logger.error(f"Mijozga xabar yuborish xatosi: {e}")
        return False
