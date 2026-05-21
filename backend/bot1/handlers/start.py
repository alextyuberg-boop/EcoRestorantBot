"""
Bot 1 — /start handler va Onboarding FSM
Yangi oqim: /start → Til → Telefon → Asosiy Menyu
"""
import logging
from aiogram import Router, types, F, Bot
from aiogram.filters import CommandStart, CommandObject, Command
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import RestaurantOwner, Restaurant, UserLanguage
from bot1.states import OnboardingStates
from bot1.keyboards import (
    lang_keyboard, phone_keyboard, remove_keyboard,
    main_menu_keyboard, restaurant_connected_keyboard,
    no_restaurant_keyboard,
)

logger = logging.getLogger(__name__)
router = Router()


# ── i18n matnlar ───────────────────────────────────────────────────────

WELCOME = {
    "uz": (
        "🌿 <b>EcoRestaurant</b>'ga xush kelibsiz!\n\n"
        "Davom etish uchun tilni tanlang:"
    ),
    "ru": (
        "🌿 Добро пожаловать в <b>EcoRestaurant</b>!\n\n"
        "Выберите язык для продолжения:"
    ),
    "en": (
        "🌿 Welcome to <b>EcoRestaurant</b>!\n\n"
        "Choose a language to continue:"
    ),
}

PHONE_REQUEST = {
    "uz": "📞 Telefon raqamingizni ulashing.\n\nQuyidagi tugmani bosing:",
    "ru": "📞 Поделитесь своим номером телефона.\n\nНажмите кнопку ниже:",
    "en": "📞 Please share your phone number.\n\nTap the button below:",
}

MAIN_MENU_TEXT = {
    "uz": "🏠 <b>Bosh menyu</b>\n\nQuyidan bo'limni tanlang:",
    "ru": "🏠 <b>Главное меню</b>\n\nВыберите раздел ниже:",
    "en": "🏠 <b>Main Menu</b>\n\nSelect a section below:",
}

NO_RESTAURANT_TEXT = {
    "uz": (
        "🏪 <b>Sizda hali restoran boti ulanmagan.</b>\n\n"
        "Botingizni ulash uchun:\n\n"
        "1️⃣ @BotFather botiga kiring va <b>/newbot</b> buyrug'ini yuboring.\n"
        "2️⃣ Botingiz uchun nom va username tanlang.\n"
        "3️⃣ BotFather sizga <b>HTTP API Token</b> beradi.\n"
        "   <i>Masalan:</i> <code>123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>\n\n"
        "👇 O'sha tokenni shu yerga yuboring:"
    ),
    "ru": (
        "🏪 <b>У вас ещё нет подключённого бота ресторана.</b>\n\n"
        "Чтобы подключить бота:\n\n"
        "1️⃣ Перейдите в @BotFather и отправьте <b>/newbot</b>.\n"
        "2️⃣ Выберите имя и username для бота.\n"
        "3️⃣ BotFather выдаст вам <b>HTTP API Token</b>.\n\n"
        "👇 Отправьте этот токен сюда:"
    ),
    "en": (
        "🏪 <b>You don't have a restaurant bot connected yet.</b>\n\n"
        "To connect your bot:\n\n"
        "1️⃣ Go to @BotFather and send <b>/newbot</b>.\n"
        "2️⃣ Choose a name and username for your bot.\n"
        "3️⃣ BotFather will give you an <b>HTTP API Token</b>.\n\n"
        "👇 Send that token here:"
    ),
}

RESTAURANT_CONNECTED_TEXT = {
    "uz": "✅ <b>Sizning restoran botingiz ulangan:</b>\n\n🤖 Bot nomi: {name}\n🔗 Link: @{username}",
    "ru": "✅ <b>Ваш бот ресторана подключён:</b>\n\n🤖 Название: {name}\n🔗 Ссылка: @{username}",
    "en": "✅ <b>Your restaurant bot is connected:</b>\n\n🤖 Bot name: {name}\n🔗 Link: @{username}",
}

DISCONNECT_SUCCESS = {
    "uz": "✅ Bot muvaffaqiyatli uzildi. Endi yangi bot ulay olasiz.",
    "ru": "✅ Бот успешно отключён. Теперь вы можете подключить новый бот.",
    "en": "✅ Bot disconnected successfully. You can now connect a new bot.",
}

DISCONNECT_ERROR = {
    "uz": "❌ Botni uzishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    "ru": "❌ Ошибка при отключении бота. Пожалуйста, попробуйте снова.",
    "en": "❌ Error disconnecting bot. Please try again.",
}

TOKEN_INVALID = {
    "uz": "❌ Noto'g'ri token formati. Iltimos, BotFather bergan tokenni to'g'ri nusxalang.",
    "ru": "❌ Неверный формат токена. Пожалуйста, скопируйте токен из BotFather правильно.",
    "en": "❌ Invalid token format. Please copy the token from BotFather correctly.",
}

TOKEN_CHECKING = {
    "uz": "⏳ Token tekshirilmoqda...",
    "ru": "⏳ Проверяем токен...",
    "en": "⏳ Checking token...",
}

TOKEN_ERROR = {
    "uz": "❌ Token noto'g'ri yoki yaroqsiz. Qayta urinib ko'ring.",
    "ru": "❌ Токен неверный или недействительный. Попробуйте снова.",
    "en": "❌ Token is invalid or expired. Please try again.",
}

TOKEN_USED = {
    "uz": "❌ Bu bot allaqachon boshqa foydalanuvchi tomonidan ulangan.",
    "ru": "❌ Этот бот уже подключён другим пользователем.",
    "en": "❌ This bot is already connected by another user.",
}

TOKEN_SUCCESS = {
    "uz": (
        "🎉 <b>Tabriklaymiz!</b>\n\n"
        "Sizning restoran botingiz muvaffaqiyatli ulandi.\n\n"
        "👉 @{username}\n\n"
        "Botingizga o'ting va <b>/start</b> ni bosing!"
    ),
    "ru": (
        "🎉 <b>Поздравляем!</b>\n\n"
        "Ваш бот ресторана успешно подключён.\n\n"
        "👉 @{username}\n\n"
        "Перейдите в ваш бот и нажмите <b>/start</b>!"
    ),
    "en": (
        "🎉 <b>Congratulations!</b>\n\n"
        "Your restaurant bot has been connected successfully.\n\n"
        "👉 @{username}\n\n"
        "Go to your bot and press <b>/start</b>!"
    ),
}

SUPPORT_SENT = {
    "uz": "✅ <b>Rahmat! Murojaatingiz qabul qilindi.</b>\n\nOperatorlarimiz tez orada siz bilan bog'lanishadi.",
    "ru": "✅ <b>Спасибо! Ваш запрос принят.</b>\n\nНаши операторы свяжутся с вами в ближайшее время.",
    "en": "✅ <b>Thank you! Your request has been received.</b>\n\nOur operators will contact you shortly.",
}


# ── Helper: Owner ma'lumotlarini olish ─────────────────────────────────

async def get_owner(telegram_id: int):
    """DB dan RestaurantOwner va uning birinchi Restaurant'ini qaytaradi."""
    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(RestaurantOwner.telegram_id == telegram_id)
        )
        owner = result.scalar_one_or_none()

        restaurant = None
        if owner:
            res_result = await session.execute(
                select(Restaurant).where(Restaurant.owner_id == telegram_id)
            )
            restaurant = res_result.scalar_one_or_none()

    return owner, restaurant


def get_lang(owner) -> str:
    """Owner'dan til kodini qaytaradi."""
    if owner and owner.language:
        return owner.language.value  # "uz" / "ru" / "en"
    return "uz"


# ── /start ─────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext, command: CommandObject = None):
    await state.clear()

    # Deep link: /start help
    if command and command.args == "help":
        await message.answer(
            "🙋‍♂️ <b>Yordam markaziga xush kelibsiz!</b>\n\n"
            "Muammoingiz qandayligini batafsil yozib yuboring:",
            parse_mode="HTML"
        )
        await state.set_state(OnboardingStates.support_issue)
        return

    owner, restaurant = await get_owner(message.from_user.id)

    if owner:
        # Allaqachon ro'yxatdan o'tgan — asosiy menyuni ko'rsat
        lang = get_lang(owner)
        await message.answer(
            MAIN_MENU_TEXT[lang],
            reply_markup=main_menu_keyboard(lang),
            parse_mode="HTML"
        )
    else:
        # Yangi foydalanuvchi — til tanlashni so'ra
        await message.answer(
            "🌿 <b>EcoRestaurant</b>'ga xush kelibsiz!\n\n"
            "Davom etish uchun tilni tanlang:\n\n"
            "Выберите язык:\n\n"
            "Choose language:",
            reply_markup=lang_keyboard(),
            parse_mode="HTML"
        )
        await state.set_state(OnboardingStates.language)


# ── /help ──────────────────────────────────────────────────────────────

@router.message(Command("help"))
async def cmd_help(message: types.Message, state: FSMContext):
    await state.clear()
    owner, _ = await get_owner(message.from_user.id)
    lang = get_lang(owner)

    await message.answer(
        "🙋‍♂️ <b>Qanday muammo yuz berdi?</b>\n\nMuammoingizni batafsil yozib yuboring:"
        if lang == "uz" else
        "🙋‍♂️ <b>Опишите проблему</b>\n\nОпишите вашу проблему подробно:"
        if lang == "ru" else
        "🙋‍♂️ <b>What's the issue?</b>\n\nDescribe your problem in detail:",
        parse_mode="HTML"
    )
    await state.set_state(OnboardingStates.support_issue)


@router.message(OnboardingStates.support_issue, F.text)
async def process_support_issue(message: types.Message, state: FSMContext):
    owner, _ = await get_owner(message.from_user.id)
    lang = get_lang(owner)

    logger.info(
        f"Support Request from {message.from_user.id} "
        f"({message.from_user.username or 'No Username'}): {message.text.strip()}"
    )

    await message.answer(SUPPORT_SENT[lang], parse_mode="HTML")
    await state.clear()


# ── Til tanlash ────────────────────────────────────────────────────────

@router.callback_query(OnboardingStates.language, F.data.startswith("lang_"))
async def process_language(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.data.split("_")[1]  # uz / ru / en

    # Owner yaratish (faqat til bilan, telefon keyinroq)
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
        else:
            owner.language = UserLanguage[lang]

        await session.commit()

    await callback.message.delete()
    await callback.message.answer(
        PHONE_REQUEST[lang],
        reply_markup=phone_keyboard(lang),
        parse_mode="HTML"
    )
    await state.set_state(OnboardingStates.phone)
    await callback.answer()


# ── Til o'zgartirish (asosiy menyudan) ────────────────────────────────

@router.callback_query(F.data == "menu_change_lang")
async def cb_change_language(callback: types.CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "🌐 Tilni tanlang:\n\nВыберите язык:\n\nChoose language:",
        reply_markup=lang_keyboard()
    )
    await state.set_state(OnboardingStates.change_lang)
    await callback.answer()


@router.callback_query(OnboardingStates.change_lang, F.data.startswith("lang_"))
async def process_language_change(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.data.split("_")[1]

    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(RestaurantOwner.telegram_id == callback.from_user.id)
        )
        owner = result.scalar_one_or_none()
        if owner:
            owner.language = UserLanguage[lang]
            await session.commit()

    await state.clear()
    await callback.message.edit_text(
        MAIN_MENU_TEXT[lang],
        reply_markup=main_menu_keyboard(lang),
        parse_mode="HTML"
    )
    await callback.answer()


# ── Telefon qabul qilish ───────────────────────────────────────────────

@router.message(OnboardingStates.phone, F.contact)
async def process_phone(message: types.Message, state: FSMContext):
    phone = message.contact.phone_number

    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(RestaurantOwner.telegram_id == message.from_user.id)
        )
        owner = result.scalar_one_or_none()

        if owner:
            owner.phone = phone
            await session.commit()
            lang = owner.language.value if owner.language else "uz"
        else:
            lang = "uz"

    # ReplyKeyboard'ni olib tashlab, asosiy menyuni ko'rsat
    await message.answer("✅", reply_markup=remove_keyboard())
    await message.answer(
        MAIN_MENU_TEXT[lang],
        reply_markup=main_menu_keyboard(lang),
        parse_mode="HTML"
    )
    await state.clear()


@router.message(OnboardingStates.phone)
async def process_phone_wrong(message: types.Message, state: FSMContext):
    """Telefon tugmasi emas, matn yuborilganda."""
    owner, _ = await get_owner(message.from_user.id)
    lang = get_lang(owner)
    await message.answer(PHONE_REQUEST[lang], reply_markup=phone_keyboard(lang), parse_mode="HTML")


# ── Asosiy menyu: "Restoranim" ─────────────────────────────────────────

@router.callback_query(F.data == "menu_restaurant")
async def cb_my_restaurant(callback: types.CallbackQuery, state: FSMContext):
    owner, restaurant = await get_owner(callback.from_user.id)
    lang = get_lang(owner)

    if restaurant:
        # Bot ulangan holat
        text = RESTAURANT_CONNECTED_TEXT[lang].format(
            name=restaurant.name,
            username=restaurant.bot_username or "—"
        )
        await callback.message.edit_text(
            text,
            reply_markup=restaurant_connected_keyboard(lang),
            parse_mode="HTML"
        )
    else:
        # Bot ulanmagan holat — instruksiya va token so'rash
        await callback.message.edit_text(
            NO_RESTAURANT_TEXT[lang],
            reply_markup=no_restaurant_keyboard(lang),
            parse_mode="HTML"
        )
        await state.set_state(OnboardingStates.bot_token)
        await state.update_data(lang=lang)

    await callback.answer()


# ── Ortga (asosiy menyu) ───────────────────────────────────────────────

@router.callback_query(F.data == "menu_back")
async def cb_menu_back(callback: types.CallbackQuery, state: FSMContext):
    await state.clear()
    owner, _ = await get_owner(callback.from_user.id)
    lang = get_lang(owner)

    await callback.message.edit_text(
        MAIN_MENU_TEXT[lang],
        reply_markup=main_menu_keyboard(lang),
        parse_mode="HTML"
    )
    await callback.answer()


# ── Bot token kiritish ─────────────────────────────────────────────────

@router.message(OnboardingStates.bot_token, F.text)
async def process_bot_token(message: types.Message, state: FSMContext):
    data = await state.get_data()
    owner, _ = await get_owner(message.from_user.id)
    lang = get_lang(owner)
    token = message.text.strip()

    if ":" not in token or len(token) < 30:
        await message.answer(TOKEN_INVALID[lang], parse_mode="HTML")
        return

    wait_msg = await message.answer(TOKEN_CHECKING[lang])

    # Tokenni Telegram API orqali tekshirish
    try:
        new_bot = Bot(token=token)
        bot_me = await new_bot.get_me()
        await new_bot.session.close()
    except Exception as e:
        logger.error(f"Bot token validation failed: {e}")
        await wait_msg.edit_text(TOKEN_ERROR[lang])
        return

    # Bu token allaqachon boshqa restoranda ishlatilayaptimi?
    async with async_session() as session:
        result = await session.execute(
            select(Restaurant).where(Restaurant.bot_token == token)
        )
        existing = result.scalar_one_or_none()

        if existing:
            if existing.owner_id != message.from_user.id:
                await wait_msg.edit_text(TOKEN_USED[lang])
                return
            # Ega o'ziniki — refresh qil
            restaurant = existing
        else:
            # Yangi restoran yaratish
            restaurant = Restaurant(
                owner_id=message.from_user.id,
                name=bot_me.first_name,
                bot_token=token,
                bot_username=bot_me.username,
                bot_id=bot_me.id,
            )
            session.add(restaurant)
            await session.commit()
            await session.refresh(restaurant)

            # Botni serverga ulash
            from bot_manager import register_restaurant_bot
            await register_restaurant_bot(restaurant.bot_token, restaurant.id)

    await state.clear()
    await wait_msg.edit_text(
        TOKEN_SUCCESS[lang].format(username=bot_me.username),
        parse_mode="HTML"
    )
    # Asosiy menyuga qaytish uchun
    await message.answer(
        MAIN_MENU_TEXT[lang],
        reply_markup=main_menu_keyboard(lang),
        parse_mode="HTML"
    )


# ── Botni uzish ────────────────────────────────────────────────────────

@router.callback_query(F.data == "restaurant_disconnect")
async def cb_disconnect_bot(callback: types.CallbackQuery, state: FSMContext):
    owner, _ = await get_owner(callback.from_user.id)
    lang = get_lang(owner)

    from bot_manager import disconnect_restaurant_bot
    success = await disconnect_restaurant_bot(callback.from_user.id)

    if success:
        await callback.message.edit_text(
            DISCONNECT_SUCCESS[lang],
            parse_mode="HTML"
        )
        # Asosiy menyuni yangilangan holda ko'rsat
        await callback.message.answer(
            MAIN_MENU_TEXT[lang],
            reply_markup=main_menu_keyboard(lang),
            parse_mode="HTML"
        )
    else:
        await callback.message.edit_text(
            DISCONNECT_ERROR[lang],
            parse_mode="HTML"
        )

    await state.clear()
    await callback.answer()
