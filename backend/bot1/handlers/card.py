"""
Bot 1 — Karta ulash FSM
Faqat karta raqami so'raladi (16 xona). CVV/muddat so'RALMAYDI.
"""
import logging
import re
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import RestaurantOwner
from bot1.states import CardStates
from bot1.keyboards import main_menu_keyboard, cancel_keyboard, remove_keyboard

logger = logging.getLogger(__name__)
router = Router()

CANCEL_TEXTS = {"❌ Bekor qilish", "❌ Отмена"}


def _mask_card(card_number: str) -> str:
    """Karta raqamini mask qiladi: **** **** **** 1234"""
    cleaned = re.sub(r'\D', '', card_number)
    if len(cleaned) >= 4:
        return f"**** **** **** {cleaned[-4:]}"
    return "****"


def _validate_card(card_number: str) -> bool:
    """Karta raqami formatini tekshiradi (faqat uzunlik)."""
    cleaned = re.sub(r'\D', '', card_number)
    return len(cleaned) == 16


# ── Karta ulash tugmasi ───────────────────────────────────────────────

@router.message(F.text.in_({"💳 Karta ulash", "💳 Привязать карту"}))
async def card_start(message: types.Message, state: FSMContext):
    await state.clear()

    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()

    current_card = ""
    if owner and owner.card_number:
        current_card = f"\n\n✅ Hozirgi karta: <b>{_mask_card(owner.card_number)}</b>"

    await message.answer(
        f"💳 <b>Karta ulash</b>{current_card}\n\n"
        "Karta raqamini kiriting (16 xona):\n"
        "<i>Faqat raqam, boshqa ma'lumot so'RALMAYDI</i>",
        reply_markup=cancel_keyboard()
    )
    await state.set_state(CardStates.card_number)


# ── Karta raqamini qabul qilish ───────────────────────────────────────

@router.message(CardStates.card_number, F.text.in_(CANCEL_TEXTS))
async def card_cancel(message: types.Message, state: FSMContext):
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


@router.message(CardStates.card_number, F.text)
async def card_save(message: types.Message, state: FSMContext):
    card_input = message.text.strip()

    if not _validate_card(card_input):
        await message.answer(
            "❌ Karta raqami noto'g'ri!\n\n"
            "16 ta raqam kiriting.\nMasalan: <code>8600 1234 5678 9012</code>"
        )
        return

    # Faqat raqamlarni saqlash
    cleaned_card = re.sub(r'\D', '', card_input)

    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()
        if not owner:
            await message.answer("❌ Profil topilmadi. /start bilan qayta kiring.")
            await state.clear()
            return

        owner.card_number = cleaned_card
        await session.commit()
        lang = owner.language.value if owner.language else "uz"

    await state.clear()

    # Xabarni o'chirish (xavfsizlik)
    try:
        await message.delete()
    except Exception:
        pass

    await message.answer(
        f"✅ <b>Karta muvaffaqiyatli ulandi!</b>\n\n"
        f"💳 <b>{_mask_card(cleaned_card)}</b>\n\n"
        "Pul yechish so'rovi yuborish uchun admin bilan bog'laning.",
        reply_markup=main_menu_keyboard(lang)
    )
