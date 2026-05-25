"""
bot_manager.py — Dinamik bot yaratish va boshqarish moduli.
Har bir restoran o'z botiga ega. Bot tokeni RestaurantOwner'dan
olinganda shu modul yangi Dispatcher yaratadi va webhook o'rnatadi.
"""
import os
import logging
import aiohttp
from typing import Optional

from aiogram import Bot, Dispatcher, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

logger = logging.getLogger(__name__)

# ── Aktiv botlar lug'ati ───────────────────────────────────────────────
active_bots: dict[str, Bot]        = {}   # token → Bot instance
active_dps:  dict[str, Dispatcher] = {}   # token → Dispatcher instance


# ── Token validatsiya ──────────────────────────────────────────────────

async def validate_bot_token(token: str) -> Optional[dict]:
    """
    Telegram API orqali tokenni tekshiradi.
    Muvaffaqiyatli bo'lsa bot ma'lumotlarini (username, id, first_name) qaytaradi.
    Xato bo'lsa None qaytaradi.
    """
    url = f"https://api.telegram.org/bot{token}/getMe"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json()
                if data.get("ok"):
                    return data["result"]
                logger.warning(f"Token invalid: {data.get('description')}")
                return None
    except Exception as e:
        logger.error(f"Token validatsiya xatosi: {e}")
        return None


# ── Webhook o'rnatish ──────────────────────────────────────────────────

async def set_bot_webhook(token: str) -> bool:
    """Bot uchun webhook URL o'rnatadi."""
    base_url = os.getenv("BASE_URL")
    if not base_url:
        logger.error("BASE_URL environment variable topilmadi! InsForge secrets ichida BASE_URL ni o'rnating.")
        return False

    webhook_url = f"{base_url}/bot/{token}"
    api_url = f"https://api.telegram.org/bot{token}/setWebhook"

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.post(api_url, json={"url": webhook_url}) as resp:
                data = await resp.json()
                if data.get("ok"):
                    logger.info(f"Webhook o'rnatildi: {webhook_url}")
                    return True
                logger.error(f"Webhook xatosi: {data.get('description')}")
                return False
    except Exception as e:
        logger.error(f"Webhook o'rnatish xatosi: {e}")
        return False


async def delete_bot_webhook(token: str) -> bool:
    """Bot webhookini o'chiradi (masalan, bot o'chirilganda)."""
    api_url = f"https://api.telegram.org/bot{token}/deleteWebhook"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.post(api_url) as resp:
                data = await resp.json()
                return data.get("ok", False)
    except Exception as e:
        logger.error(f"Webhook o'chirish xatosi: {e}")
        return False


# ── Bot ro'yxatga olish ────────────────────────────────────────────────

async def register_restaurant_bot(token: str, restaurant_id: int) -> bool:
    """
    Yangi restoran boti uchun aiogram Bot + Dispatcher yaratadi va
    xotirada saqlaydi. Webhook ham o'rnatiladi.

    Bu funksiya ikki holatda chaqiriladi:
    1. Restoran egasi yangi token berganida (Bot 1 handler'dan)
    2. Server qayta ishga tushganda (DB dan barcha aktiv botlarni yuklash)
    """
    if token in active_bots:
        logger.info(f"Bot allaqachon ro'yxatda: {token[:10]}...")
        return True

    try:
        # aiogram Bot instance
        bot = Bot(
            token=token,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML)
        )

        # Dispatcher + shablon handler'larni ulash
        dp = Dispatcher()

        # Bot 2 (Mijoz boti) handler'larini import qilib ulash
        # Circular import oldini olish uchun shu yerda import qilinadi
        from bot2.router import get_customer_router
        customer_router = get_customer_router(restaurant_id)
        dp.include_router(customer_router)

        # Xotirada saqlash
        active_bots[token] = bot
        active_dps[token]  = dp

        # Webhook o'rnatish
        await set_bot_webhook(token)

        logger.info(f"Bot ro'yxatga olindi: restaurant_id={restaurant_id}")
        return True

    except Exception as e:
        logger.error(f"Bot ro'yxatga olish xatosi: {e}")
        # Yarim holat tozalash
        active_bots.pop(token, None)
        active_dps.pop(token, None)
        return False


async def unregister_restaurant_bot(token: str) -> bool:
    """Bot va uning dispatcher'ini xotiradan o'chiradi."""
    bot = active_bots.pop(token, None)
    active_dps.pop(token, None)

    if bot:
        await delete_bot_webhook(token)
        await bot.session.close()
        logger.info(f"Bot o'chirildi: {token[:10]}...")
        return True
    return False


async def disconnect_restaurant_bot(owner_id: int) -> bool:
    """
    Restoran egasi botini to'liq uzadi:
    1. DB dan restaurant yozuvini o'chiradi. Agar xatolik bo'lsa (buyurtmalar tufayli), tokenlarni tozalaydi.
    2. active_bots / active_dps dan chiqaradi.
    3. Telegram webhookini o'chiradi.
    Muvaffaqiyatli bo'lsa True, aks holda False qaytaradi.
    """
    from database import async_session
    from sqlalchemy.future import select
    from models import Restaurant

    token = None
    async with async_session() as session:
        result = await session.execute(
            select(Restaurant).where(Restaurant.owner_id == owner_id)
        )
        restaurant = result.scalars().first()

        if not restaurant:
            logger.warning(f"disconnect_restaurant_bot: owner_id={owner_id} uchun restoran topilmadi.")
            return False

        token = restaurant.bot_token

        try:
            # DB dan to'liq o'chirishga harakat qilamiz
            await session.delete(restaurant)
            await session.commit()
            logger.info(f"Restaurant DB dan o'chirildi: owner_id={owner_id}")
        except Exception as e:
            logger.warning(f"Restaurant o'chirishda cheklovlar yuz berdi (faol buyurtmalar bo'lishi mumkin), bot ma'lumotlarini tozalaymiz: {e}")
            await session.rollback()
            # Bot tokenini va usernameini tozalab qo'yamiz (token unique va non-nullable bo'lgani uchun random qilamiz)
            import os
            result = await session.execute(
                select(Restaurant).where(Restaurant.owner_id == owner_id)
            )
            restaurant = result.scalars().first()
            if restaurant:
                restaurant.bot_token = f"disconnected_{owner_id}_{os.urandom(4).hex()}"
                restaurant.bot_username = None
                restaurant.is_active = False
                await session.commit()
                logger.info(f"Restaurant bot ma'lumotlari tozalandi (soft-disconnect): owner_id={owner_id}")

    # Serverdan o'chirish (xotira + webhook)
    if token:
        await unregister_restaurant_bot(token)
    return True


# ── Server ishga tushganda barcha botlarni yuklash ────────────────────

async def load_all_restaurant_bots():
    """
    Ilovani ishga tushirishda DB dan barcha aktiv restoran botlarini
    yuklaydi va xotirada ro'yxatga oladi.
    """
    from database import async_session
    from sqlalchemy.future import select
    from models import Restaurant

    logger.info("Barcha aktiv restoran botlari yuklanmoqda...")

    async with async_session() as session:
        result = await session.execute(
            select(Restaurant).where(Restaurant.is_active == True)
        )
        restaurants = result.scalars().all()

    count = 0
    for restaurant in restaurants:
        if restaurant.bot_token:
            success = await register_restaurant_bot(
                restaurant.bot_token, restaurant.id
            )
            if success:
                count += 1

    logger.info(f"{count} ta restoran boti yuklandi.")
