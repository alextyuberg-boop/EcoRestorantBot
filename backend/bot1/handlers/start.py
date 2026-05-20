"""
Bot 1 — /start handler and Onboarding FSM
Registers the creator and creates a Restaurant from Bot Token.
"""
import logging
from aiogram import Router, types, F, Bot
from aiogram.filters import CommandStart, CommandObject, Command
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import RestaurantOwner, Restaurant, UserLanguage
from bot1.states import OnboardingStates
from bot1.keyboards import lang_keyboard
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger(__name__)
router = Router()


# ── /start ─────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext, command: CommandObject = None):
    await state.clear()

    # Deep link parameter: /start help
    if command and command.args == "help":
        await message.answer(
            "🙋‍♂️ <b>Yordam markaziga xush kelibsiz!</b>\n\n"
            "Muammoingiz qandayligini batafsil yozib yuboring, biz sizga yordam beramiz:",
            parse_mode="HTML"
        )
        await state.set_state(OnboardingStates.support_issue)
        return

    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = result.scalar_one_or_none()

    # Ask for language
    await message.answer(
        "🌿 <b>EcoRestaurant</b>'ga xush kelibsiz!\n\n"
        "Davom etish uchun tilni tanlang:\n\n"
        "Выберите язык:\n\n"
        "Choose language:",
        reply_markup=lang_keyboard()
    )
    await state.set_state(OnboardingStates.language)


# ── /help ──────────────────────────────────────────────────────────────

@router.message(Command("help"))
async def cmd_help(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "🙋‍♂️ <b>Qanday muammo yuz berdi?</b>\n\n"
        "Muammoingiz qandayligini batafsil yozib yuboring, biz sizga yordam beramiz:",
        parse_mode="HTML"
    )
    await state.set_state(OnboardingStates.support_issue)


@router.message(OnboardingStates.support_issue, F.text)
async def process_support_issue(message: types.Message, state: FSMContext):
    user_issue = message.text.strip()
    
    await message.answer(
        "✅ <b>Rahmat! Murojaatingiz yordam markaziga qabul qilindi.</b>\n\n"
        "Operatorlarimiz tez orada siz bilan bog'lanishadi. Iltimos, aloqada bo'ling.",
        parse_mode="HTML"
    )
    
    await state.clear()
    logger.info(f"Support Request from {message.from_user.id} ({message.from_user.username or 'No Username'}): {user_issue}")


# ── Language Selection ──────────────────────────────────────────────────

@router.callback_query(OnboardingStates.language, F.data.startswith("lang_"))
async def process_language(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.data.split("_")[1]  # uz / ru / en
    
    # Create or update Owner
    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(RestaurantOwner.telegram_id == callback.from_user.id)
        )
        owner = result.scalar_one_or_none()
        
        if not owner:
            owner = RestaurantOwner(
                telegram_id=callback.from_user.id,
                full_name=callback.from_user.full_name,
                language=UserLanguage[lang]
            )
            session.add(owner)
            await session.commit()
            
    await callback.message.delete()
    await send_bot_instructions(callback.message, lang)
    await state.set_state(OnboardingStates.bot_token)


async def send_bot_instructions(message: types.Message, lang: str):
    instructions = {
        "uz": (
            "🤖 <b>Shaxsiy botingizni ulash</b>\n\n"
            "1️⃣ @BotFather botiga kiring va <b>/newbot</b> buyrug'ini yuboring.\n"
            "2️⃣ Botingiz uchun nom va username tanlang.\n"
            "3️⃣ BotFather sizga <b>HTTP API Token</b> beradi (masalan: <code>123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>).\n\n"
            "👇 O'sha tokenni shu yerga yuboring:"
        ),
        "ru": (
            "🤖 <b>Подключение вашего бота</b>\n\n"
            "1️⃣ Перейдите в @BotFather и отправьте команду <b>/newbot</b>.\n"
            "2️⃣ Выберите имя и username для вашего бота.\n"
            "3️⃣ BotFather выдаст вам <b>HTTP API Token</b>.\n\n"
            "👇 Отправьте этот токен сюда:"
        ),
        "en": (
            "🤖 <b>Connect your bot</b>\n\n"
            "1️⃣ Go to @BotFather and send <b>/newbot</b>.\n"
            "2️⃣ Choose a name and username for your bot.\n"
            "3️⃣ BotFather will give you an <b>HTTP API Token</b>.\n\n"
            "👇 Send that token here:"
        )
    }
    text = instructions.get(lang, instructions["uz"])
    
    # If the message is from a callback, reply to its chat
    chat_id = message.chat.id
    
    # We need a generic bot instance to send message
    await message.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")


# ── Token Input ────────────────────────────────────────────────────────

@router.message(OnboardingStates.bot_token, F.text)
async def process_bot_token(message: types.Message, state: FSMContext):
    token = message.text.strip()
    
    if ":" not in token or len(token) < 30:
        await message.answer("❌ Noto'g'ri token formati. Iltimos, BotFather bergan tokenni to'g'ri nusxalang.")
        return

    wait_msg = await message.answer("⏳ Token tekshirilmoqda...")
    
    # Validate token
    try:
        new_bot = Bot(token=token)
        bot_me = await new_bot.get_me()
        await new_bot.session.close()
    except Exception as e:
        logger.error(f"Bot token validation failed: {e}")
        await wait_msg.edit_text("❌ Token noto'g'ri yoki yaroqsiz. Qayta urinib ko'ring.")
        return

    # Check if this token is already used
    async with async_session() as session:
        result = await session.execute(select(Restaurant).where(Restaurant.bot_token == token))
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.owner_id != message.from_user.id:
                await wait_msg.edit_text("❌ Bu bot allaqachon boshqa foydalanuvchi tomonidan ulangan.")
                return
            else:
                restaurant = existing
        else:
            # Create new restaurant
            restaurant = Restaurant(
                owner_id=message.from_user.id,
                name=bot_me.first_name,
                bot_token=token,
                bot_username=bot_me.username,
                bot_id=bot_me.id
            )
            session.add(restaurant)
            await session.commit()
            await session.refresh(restaurant)

            # Start the new bot dynamically
            from bot_manager import register_restaurant_bot
            await register_restaurant_bot(restaurant.bot_token, restaurant.id)

        # Success message
        await wait_msg.edit_text(
            f"✅ <b>Tabriklaymiz!</b>\n\n"
            f"Sizning restoraningiz muvaffaqiyatli yaratildi.\n\n"
            f"Barcha sozlamalar va admin panel shaxsiy botingiz ichida joylashgan.\n"
            f"Hozir o'z botingizga o'ting va <b>/start</b> ni bosing:\n\n"
            f"👉 @{bot_me.username}",
            parse_mode="HTML"
        )
        
        # We can clear state now, they are fully onboarded.
        await state.clear()
