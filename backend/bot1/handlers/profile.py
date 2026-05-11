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

    async with async_session() as session:
        rest_r = await session.execute(
            select(Restaurant).where(Restaurant.owner_id == message.from_user.id).limit(1)
        )
        restaurant = rest_r.scalar_one_or_none()

        if not restaurant:
            await message.answer("❌ Avval botingizni sozlang.")
            return

        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())

        # Bugungi zakazlar
        today_orders_r = await session.execute(
            select(func.count(Order.id), func.sum(Order.total_amount))
            .where(
                Order.restaurant_id == restaurant.id,
                Order.created_at >= today_start,
                Order.status != OrderStatus.cancelled,
            )
        )
        today_count, today_total = today_orders_r.one()

        # Aktiv zakazlar
        active_r = await session.execute(
            select(func.count(Order.id))
            .where(
                Order.restaurant_id == restaurant.id,
                Order.status.in_([
                    OrderStatus.new, OrderStatus.confirmed,
                    OrderStatus.paid, OrderStatus.cooking, OrderStatus.delivery
                ])
            )
        )
        active_count = active_r.scalar()

        # Haftalik
        week_start = today_start - timedelta(days=7)
        week_r = await session.execute(
            select(func.count(Order.id), func.sum(Order.total_amount))
            .where(
                Order.restaurant_id == restaurant.id,
                Order.created_at >= week_start,
                Order.status != OrderStatus.cancelled,
            )
        )
        week_count, week_total = week_r.one()

    today_total = float(today_total or 0)
    week_total  = float(week_total or 0)

    text = (
        f"📊 <b>Statistika — {restaurant.name}</b>\n\n"
        f"📅 <b>Bugun:</b>\n"
        f"  📦 Zakazlar: <b>{today_count or 0} ta</b>\n"
        f"  💰 Daromad: <b>{today_total:,.0f} so'm</b>\n\n"
        f"📆 <b>Oxirgi 7 kun:</b>\n"
        f"  📦 Zakazlar: <b>{week_count or 0} ta</b>\n"
        f"  💰 Daromad: <b>{week_total:,.0f} so'm</b>\n\n"
        f"⚡ <b>Hozir aktiv:</b> {active_count or 0} ta zakaz"
    )
    await message.answer(text)


# ── Profil ────────────────────────────────────────────────────────────

@router.message(F.text.in_({"👤 Profil", "👤 Профиль"}))
async def show_profile(message: types.Message, state: FSMContext):
    await state.clear()

    async with async_session() as session:
        owner_r = await session.execute(
            select(RestaurantOwner).where(
                RestaurantOwner.telegram_id == message.from_user.id
            )
        )
        owner = owner_r.scalar_one_or_none()

        rest_r = await session.execute(
            select(Restaurant).where(Restaurant.owner_id == message.from_user.id)
        )
        restaurants = rest_r.scalars().all()

    if not owner:
        await message.answer("❌ Profil topilmadi. /start bilan qayta kiring.")
        return

    from bot1.handlers.card import _mask_card
    card_text = _mask_card(owner.card_number) if owner.card_number else "—"
    rest_list = "\n".join(f"  🤖 @{r.bot_username or '?'} — {r.name}" for r in restaurants) or "  (yo'q)"
    lang_map = {"uz": "O'zbek", "ru": "Русский", "en": "English"}
    lang_str = lang_map.get(owner.language.value if owner.language else "uz", "O'zbek")

    await message.answer(
        f"👤 <b>Profil</b>\n\n"
        f"Ism: <b>{owner.full_name or '—'}</b>\n"
        f"Tel: <b>{owner.phone or '—'}</b>\n"
        f"Til: <b>{lang_str}</b>\n"
        f"💳 Karta: <b>{card_text}</b>\n"
        f"💰 Balans: <b>{float(owner.balance or 0):,.0f} so'm</b>\n\n"
        f"🤖 Botlar:\n{rest_list}"
    )


# ── Sozlamalar ────────────────────────────────────────────────────────

@router.message(F.text.in_({"⚙️ Sozlamalar", "⚙️ Настройки"}))
async def show_settings(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "⚙️ <b>Sozlamalar</b>\n\n"
        "Tilni o'zgartirish uchun:", reply_markup=lang_keyboard()
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
