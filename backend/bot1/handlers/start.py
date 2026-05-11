"""
Bot 1 — /start handler va Onboarding FSM
Yangi egalar: Til → Ism → Restoran nomi → Manzil → Telefon
"""
import logging
from aiogram import Router, types, F
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import RestaurantOwner, UserLanguage
from bot1.states import OnboardingStates
from bot1.keyboards import main_menu_keyboard, lang_keyboard, phone_request_keyboard

logger = logging.getLogger(__name__)
router = Router()


# ── /start ─────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    await state.clear()

    async with async_session() as session:
        result = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = result.scalar_one_or_none()

    if owner and owner.phone:
        # Ro'yxatdan o'tgan — asosiy menyuni ko'rsatish
        await message.answer(
            f"🌿 <b>EcoRestaurant</b>\n\n"
            f"Salom, {owner.full_name or message.from_user.first_name}! "
            f"Nima qilmoqchisiz?",
            reply_markup=main_menu_keyboard(owner.language.value if owner.language else "uz")
        )
    else:
        # Yangi foydalanuvchi — onboarding boshlash
        await message.answer(
            "🌿 <b>EcoRestaurant</b>'ga xush kelibsiz!\n\n"
            "Davom etish uchun tilni tanlang:\n\n"
            "Выберите язык:\n\n"
            "Choose language:",
            reply_markup=lang_keyboard()
        )
        await state.set_state(OnboardingStates.language)


# ── Til tanlash ────────────────────────────────────────────────────────

@router.callback_query(OnboardingStates.language, F.data.startswith("lang_"))
async def process_language(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.data.split("_")[1]  # uz / ru / en
    await state.update_data(language=lang)

    texts = {
        "uz": "Ismingizni kiriting (to'liq ism):",
        "ru": "Введите ваше имя (полное имя):",
        "en": "Enter your full name:",
    }
    await callback.message.edit_text(f"✅ Til tanlandi!\n\n{texts.get(lang, texts['uz'])}")
    await state.set_state(OnboardingStates.owner_name)


# ── Ism ────────────────────────────────────────────────────────────────

@router.message(OnboardingStates.owner_name, F.text)
async def process_owner_name(message: types.Message, state: FSMContext):
    name = message.text.strip()
    if len(name) < 2:
        await message.answer("❌ Ism kamida 2 ta harfdan iborat bo'lishi kerak.")
        return

    await state.update_data(owner_name=name)
    await message.answer(
        f"👍 Rahmat, <b>{name}</b>!\n\n"
        "Restoraningiz nomini kiriting:"
    )
    await state.set_state(OnboardingStates.restaurant_name)


# ── Restoran nomi ──────────────────────────────────────────────────────

@router.message(OnboardingStates.restaurant_name, F.text)
async def process_restaurant_name(message: types.Message, state: FSMContext):
    rest_name = message.text.strip()
    if len(rest_name) < 2:
        await message.answer("❌ Restoran nomi kamida 2 ta harfdan iborat bo'lishi kerak.")
        return

    await state.update_data(restaurant_name=rest_name)
    await message.answer("📍 Restoran manzilini kiriting\n(shahar, ko'cha, uy):")
    await state.set_state(OnboardingStates.address)


# ── Manzil ─────────────────────────────────────────────────────────────

@router.message(OnboardingStates.address, F.text)
async def process_address(message: types.Message, state: FSMContext):
    address = message.text.strip()
    await state.update_data(address=address)
    await message.answer(
        "📞 Telefon raqamingizni yuboring:",
        reply_markup=phone_request_keyboard()
    )
    await state.set_state(OnboardingStates.phone)


# ── Telefon ────────────────────────────────────────────────────────────

@router.message(OnboardingStates.phone, F.contact)
async def process_phone_contact(message: types.Message, state: FSMContext):
    phone = message.contact.phone_number
    await _save_and_finish(message, state, phone)


@router.message(OnboardingStates.phone, F.text)
async def process_phone_text(message: types.Message, state: FSMContext):
    phone = message.text.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+" + phone
    if len(phone) < 10:
        await message.answer("❌ Telefon raqam noto'g'ri. Qayta kiriting:")
        return
    await _save_and_finish(message, state, phone)


async def _save_and_finish(message: types.Message, state: FSMContext, phone: str):
    """Ma'lumotlarni DB ga saqlab, asosiy menyuni ko'rsatadi."""
    data = await state.get_data()
    lang_str = data.get("language", "uz")
    lang = UserLanguage[lang_str] if lang_str in UserLanguage.__members__ else UserLanguage.uz

    async with async_session() as session:
        # Egani yangilash yoki yaratish
        result = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = result.scalar_one_or_none()

        if not owner:
            owner = RestaurantOwner(telegram_id=message.from_user.id)
            session.add(owner)

        owner.full_name = data.get("owner_name", message.from_user.full_name)
        owner.phone     = phone
        owner.language  = lang

        await session.commit()

    await state.clear()

    await message.answer(
        "🎉 <b>Ro'yxatdan o'tish muvaffaqiyatli!</b>\n\n"
        f"Ism: <b>{owner.full_name}</b>\n"
        f"Tel: <b>{phone}</b>\n\n"
        "Endi restoraningizni boshqarishingiz mumkin!\n"
        "Botingizni sozlash uchun <b>🤖 Botimni sozla</b> tugmasini bosing.",
        reply_markup=main_menu_keyboard(lang_str)
    )
