"""
Bot 1 — Bot o'rnatish: restoran egasidan Bot 2 token qabul qilish,
validatsiya qilish va shablon botni o'rnatish.
"""
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import Restaurant, RestaurantOwner
from bot1.states import BotSetupStates
from bot1.keyboards import main_menu_keyboard, cancel_keyboard
from bot_manager import validate_bot_token, register_restaurant_bot

logger = logging.getLogger(__name__)
router = Router()

CANCEL_TEXTS = {"❌ Bekor qilish", "❌ Отмена"}


# ── Botimni sozla ──────────────────────────────────────────────────────

@router.message(F.text.in_({"🤖 Botimni sozla", "🤖 Настроить бота"}))
async def bot_setup_start(message: types.Message, state: FSMContext):
    await state.clear()

    instructions = (
        "🤖 <b>Bot o'rnatish yo'riqnomasi</b>\n\n"
        "1️⃣ Telegramda <b>@BotFather</b> ga o'ting\n"
        "2️⃣ <code>/newbot</code> yuboring\n"
        "3️⃣ Botingiz nomini kiriting (masalan: <i>My Restaurant</i>)\n"
        "4️⃣ Bot username'ini kiriting (masalan: <i>myrestaurant_bot</i>)\n"
        "5️⃣ <b>BotFather</b> sizga token beradi:\n"
        "   <code>1234567890:ABCDefGH...</code>\n\n"
        "Shu tokenni quyida yuboring 👇"
    )
    await message.answer(instructions, reply_markup=cancel_keyboard())
    await state.set_state(BotSetupStates.token)


# ── Token qabul qilish ─────────────────────────────────────────────────

@router.message(BotSetupStates.token, F.text.in_(CANCEL_TEXTS))
async def bot_setup_cancel(message: types.Message, state: FSMContext):
    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()
    lang = owner.language.value if (owner and owner.language) else "uz"
    await state.clear()
    await message.answer("❌ Bekor qilindi.", reply_markup=main_menu_keyboard(lang))


@router.message(BotSetupStates.token, F.text)
async def bot_setup_token(message: types.Message, state: FSMContext):
    token = message.text.strip()

    # Token format tekshiruvi (sodda)
    if ":" not in token or len(token) < 30:
        await message.answer(
            "❌ Token formati noto'g'ri.\n\n"
            "Token quyidagicha ko'rinishda bo'lishi kerak:\n"
            "<code>1234567890:ABCDefGHIjklMnoPQRStuVWXyz</code>\n\n"
            "Qayta kiriting:"
        )
        return

    processing_msg = await message.answer("⏳ Token tekshirilmoqda...")

    # Telegram API orqali validatsiya
    bot_info = await validate_bot_token(token)

    if not bot_info:
        await processing_msg.edit_text(
            "❌ <b>Token yaroqsiz yoki botga kirishda xatolik yuz berdi.</b>\n\n"
            "Token to'g'ri ekanligini tekshiring va qayta yuboring:"
        )
        return

    bot_username = bot_info.get("username", "")
    bot_name     = bot_info.get("first_name", "")
    bot_id       = bot_info.get("id")

    await processing_msg.edit_text(
        f"✅ <b>Bot topildi!</b>\n\n"
        f"🤖 <b>{bot_name}</b> (@{bot_username})\n\n"
        "⏳ Shablon o'rnatilmoqda..."
    )

    # Eganing restoranini toping yoki yangi yarating
    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()

        if not owner:
            await processing_msg.edit_text("❌ Profil topilmadi. /start bilan qayta kiring.")
            await state.clear()
            return

        # Mavjud tokenni tekshirish
        existing_r = await session.execute(
            select(Restaurant).where(Restaurant.bot_token == token)
        )
        existing = existing_r.scalar_one_or_none()

        if existing and existing.owner_id != owner.telegram_id:
            await processing_msg.edit_text(
                "❌ Bu token boshqa egaga tegishli.\n"
                "Yangi token kiritng:"
            )
            return

        if existing:
            restaurant = existing
        else:
            # Yangi restoran yozuvi yaratish
            # Avval onboarding'dagi restoran nomini olish
            rest_r = await session.execute(
                select(Restaurant).where(Restaurant.owner_id == owner.telegram_id)
                .limit(1)
            )
            first_restaurant = rest_r.scalar_one_or_none()

            restaurant = Restaurant(
                owner_id     = owner.telegram_id,
                name         = first_restaurant.name if first_restaurant else bot_name,
                bot_token    = token,
                bot_username = bot_username,
                bot_id       = bot_id,
            )
            session.add(restaurant)
            await session.commit()
            await session.refresh(restaurant)

    # Dynamik botni ro'yxatga olish va webhook o'rnatish
    success = await register_restaurant_bot(token, restaurant.id)

    lang = owner.language.value if owner.language else "uz"

    if success:
        await processing_msg.edit_text(
            f"🎉 <b>Botingiz tayyor!</b>\n\n"
            f"🤖 @{bot_username}\n\n"
            "Mijozlaringiz shu bot orqali menyu ko'rib zakaz berishi mumkin.\n\n"
            "Keyingi qadam — <b>🍽 Menyu</b> bo'limida taomlar qo'shing!",
        )
        await state.clear()
        await message.answer(
            "Asosiy menyuga qaytdingiz.",
            reply_markup=main_menu_keyboard(lang)
        )
    else:
        await processing_msg.edit_text(
            "❌ Webhook o'rnatishda xatolik yuz berdi.\n"
            "SERVER_URL sozlamasini tekshiring yoki qayta urinib ko'ring."
        )
        await state.clear()
        await message.answer(".", reply_markup=main_menu_keyboard(lang))
