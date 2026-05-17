"""
Bot 1 — Statistika va Profil handler'lari.
"""
import logging
from datetime import datetime, timedelta
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select
from sqlalchemy import func

from database import async_session
from models import Restaurant, RestaurantOwner, Order, OrderStatus
from bot1.keyboards import main_menu_keyboard, lang_keyboard

logger = logging.getLogger(__name__)
router = Router()


# ── Statistika ────────────────────────────────────────────────────────

@router.message(F.text.in_({"📊 Statistika", "📊 Статистика"}))
async def show_stats(message: types.Message, state: FSMContext):
    await state.clear()
    import os
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")

    await message.answer(
        "📊 <b>Statistika va hisobotlar</b>\n\n"
        "Bugungi buyurtmalar, umumiy daromadlar va batafsil hisobotlarni real-vaqt rejimida ko'rish uchun **Kabinet (Mini App)**'ga kiring 👇",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(
                text="📱 Kabinetni ochish",
                web_app=types.WebAppInfo(url=mini_app_url)
            )]
        ])
    )


# ── Profil ────────────────────────────────────────────────────────────

@router.message(F.text.in_({"👤 Profil", "👤 Профиль"}))
async def show_profile(message: types.Message, state: FSMContext):
    await state.clear()
    import os
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")

    await message.answer(
        "👤 <b>Profil boshqaruvi</b>\n\n"
        "Profilingiz, shaxsiy ma'lumotlaringiz va bog'langan botlar ro'yxatini boshqarish uchun **Kabinet (Mini App)**'ga kiring 👇",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(
                text="📱 Kabinetni ochish",
                web_app=types.WebAppInfo(url=mini_app_url)
            )]
        ])
    )


# ── Sozlamalar ────────────────────────────────────────────────────────

@router.message(F.text.in_({"⚙️ Sozlamalar", "⚙️ Настройки"}))
async def show_settings(message: types.Message, state: FSMContext):
    await state.clear()
    import os
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")

    await message.answer(
        "⚙️ <b>Sozlamalar boshqaruvi</b>\n\n"
        "Tizim sozlamalari va til parametrlarini boshqarish uchun **Kabinet (Mini App)**'ga kiring 👇",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(
                text="📱 Kabinetni ochish",
                web_app=types.WebAppInfo(url=mini_app_url)
            )]
        ])
    )


@router.callback_query(F.data.startswith("lang_"))
async def change_language(callback: types.CallbackQuery, state: FSMContext):
    # Onboarding'dan tashqarida ham til o'zgartirishga imkon
    current_state = await state.get_state()
    if current_state is not None:
        return  # FSM aktiv bo'lsa — bu onboarding davomida kelgan

    lang = callback.data.split("_")[1]
    from models import UserLanguage
    lang_enum = UserLanguage[lang] if lang in UserLanguage.__members__ else UserLanguage.uz

    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == callback.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()
        if owner:
            owner.language = lang_enum
            await session.commit()

    lang_map = {"uz": "O'zbek", "ru": "Русский", "en": "English"}
    await callback.message.edit_text(
        f"✅ Til o'zgartirildi: <b>{lang_map.get(lang, lang)}</b>"
    )
    await callback.message.answer(
        "Asosiy menyu:", reply_markup=main_menu_keyboard(lang)
    )
