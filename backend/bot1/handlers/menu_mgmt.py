"""
Bot 1 — Menyu boshqaruvi FSM (kategoriya + taom CRUD).
"""
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select

from database import async_session
from models import Restaurant, MenuCategory, MenuItem, RestaurantOwner
from bot1.states import MenuCategoryStates, MenuItemStates
from bot1.keyboards import (
    main_menu_keyboard, cancel_keyboard, skip_keyboard,
    confirm_keyboard, categories_keyboard, menu_item_manage_keyboard,
    remove_keyboard
)

logger = logging.getLogger(__name__)
router = Router()

CANCEL_TEXTS = {"❌ Bekor qilish", "❌ Отмена"}
SKIP_TEXTS   = {"⏭ O'tkazib yuborish", "⏭ Пропустить"}


# ── Yordamchi: eganing birinchi restoranini olish ─────────────────────

async def get_owner_restaurant(tg_id: int) -> Restaurant | None:
    async with async_session() as session:
        result = await session.execute(
            select(Restaurant).where(Restaurant.owner_id == tg_id).limit(1)
        )
        return result.scalar_one_or_none()


# ── 🍽 Menyu tugmasi ───────────────────────────────────────────────────

@router.message(F.text.in_({"🍽 Menyu", "🍽 Меню"}))
async def show_menu_main(message: types.Message, state: FSMContext):
    await state.clear()
    restaurant = await get_owner_restaurant(message.from_user.id)
    if not restaurant:
        await message.answer("❌ Avval botingizni sozlang: <b>🤖 Botimni sozla</b>")
        return

    async with async_session() as session:
        cats_r = await session.execute(
            select(MenuCategory)
            .where(MenuCategory.restaurant_id == restaurant.id)
            .order_by(MenuCategory.sort_order)
        )
        categories = cats_r.scalars().all()

    cat_text = "\n".join(f"  📁 {c.name}" for c in categories) or "  (bo'sh)"

    await message.answer(
        f"🍽 <b>Menyu boshqaruvi</b>\n\n"
        f"Kategoriyalar:\n{cat_text}\n\n"
        f"Nima qilmoqchisiz?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="➕ Kategoriya qo'sh",  callback_data="menu_add_cat")],
            [InlineKeyboardButton(text="🍜 Taom qo'sh",        callback_data="menu_add_item")],
            [InlineKeyboardButton(text="📋 Barcha taomlar",    callback_data="menu_list_items")],
        ])
    )


from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


# ═══════════════════════════════════════════════════════════════════════
# KATEGORIYA
# ═══════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "menu_add_cat")
async def add_category_start(callback: types.CallbackQuery, state: FSMContext):
    await callback.message.answer(
        "📁 Yangi kategoriya nomini kiriting:\n(masalan: Salatlar, Sho'rvalar)",
        reply_markup=cancel_keyboard()
    )
    await state.set_state(MenuCategoryStates.name)
    await callback.answer()


@router.message(MenuCategoryStates.name, F.text.in_(CANCEL_TEXTS))
async def add_cat_cancel(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer("❌ Bekor qilindi.", reply_markup=remove_keyboard())
    await show_menu_main(message, state)


@router.message(MenuCategoryStates.name, F.text)
async def add_category_save(message: types.Message, state: FSMContext):
    name = message.text.strip()
    restaurant = await get_owner_restaurant(message.from_user.id)
    if not restaurant:
        await state.clear()
        return

    async with async_session() as session:
        # Sort order — oxirgisidan keyin
        last_r = await session.execute(
            select(MenuCategory)
            .where(MenuCategory.restaurant_id == restaurant.id)
            .order_by(MenuCategory.sort_order.desc())
            .limit(1)
        )
        last = last_r.scalar_one_or_none()
        sort_order = (last.sort_order + 1) if last else 0

        cat = MenuCategory(
            restaurant_id=restaurant.id,
            name=name,
            sort_order=sort_order,
        )
        session.add(cat)
        await session.commit()

    await state.clear()
    await message.answer(
        f"✅ <b>'{name}'</b> kategoriyasi qo'shildi!",
        reply_markup=remove_keyboard()
    )
    await show_menu_main(message, state)


# ═══════════════════════════════════════════════════════════════════════
# TAOM QO'SHISH — 6 qadam FSM
# ═══════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "menu_add_item")
async def add_item_start(callback: types.CallbackQuery, state: FSMContext):
    restaurant = await get_owner_restaurant(callback.from_user.id)
    if not restaurant:
        await callback.answer("Avval botingizni sozlang!", show_alert=True)
        return

    async with async_session() as session:
        cats_r = await session.execute(
            select(MenuCategory).where(MenuCategory.restaurant_id == restaurant.id)
        )
        categories = cats_r.scalars().all()

    if not categories:
        await callback.message.answer(
            "❌ Avval kamida bitta kategoriya qo'shing!\n"
            "Kategoriya: <b>➕ Kategoriya qo'sh</b>"
        )
        await callback.answer()
        return

    await callback.message.answer(
        "🍜 <b>Yangi taom qo'shish</b>\n\nKategoriyani tanlang:",
        reply_markup=categories_keyboard(categories, prefix="newitem_cat")
    )
    await state.set_state(MenuItemStates.category)
    await callback.answer()


@router.callback_query(MenuItemStates.category, F.data.startswith("newitem_cat_"))
async def add_item_name(callback: types.CallbackQuery, state: FSMContext):
    cat_id = int(callback.data.split("_")[2])
    await state.update_data(category_id=cat_id)
    await callback.message.answer(
        "1️⃣ Taom nomini kiriting:",
        reply_markup=cancel_keyboard()
    )
    await state.set_state(MenuItemStates.name)
    await callback.answer()


@router.message(MenuItemStates.name, F.text.in_(CANCEL_TEXTS))
async def add_item_cancel(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer("❌ Bekor qilindi.", reply_markup=remove_keyboard())


@router.message(MenuItemStates.name, F.text)
async def add_item_desc(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text.strip())
    await message.answer(
        "2️⃣ Tavsif kiriting (ixtiyoriy):",
        reply_markup=skip_keyboard()
    )
    await state.set_state(MenuItemStates.desc)


@router.message(MenuItemStates.desc, F.text)
async def add_item_price(message: types.Message, state: FSMContext):
    desc = None if message.text in SKIP_TEXTS else message.text.strip()
    await state.update_data(description=desc)
    await message.answer(
        "3️⃣ Narxni kiriting (so'mda, faqat raqam):\nMasalan: <code>45000</code>",
        reply_markup=cancel_keyboard()
    )
    await state.set_state(MenuItemStates.price)


@router.message(MenuItemStates.price, F.text)
async def add_item_image(message: types.Message, state: FSMContext):
    if message.text in CANCEL_TEXTS:
        await state.clear()
        await message.answer("❌ Bekor qilindi.", reply_markup=remove_keyboard())
        return

    try:
        price = float(message.text.replace(" ", "").replace(",", ""))
    except ValueError:
        await message.answer("❌ Faqat raqam kiriting. Masalan: <code>45000</code>")
        return

    await state.update_data(price=price)
    await message.answer(
        "4️⃣ Taom rasmini yuboring (ixtiyoriy):",
        reply_markup=skip_keyboard()
    )
    await state.set_state(MenuItemStates.image)


@router.message(MenuItemStates.image, F.photo)
async def add_item_confirm_with_photo(message: types.Message, state: FSMContext):
    file_id = message.photo[-1].file_id  # eng katta o'lcham
    await state.update_data(image_file_id=file_id)
    await _show_item_confirm(message, state)


@router.message(MenuItemStates.image, F.text)
async def add_item_confirm_no_photo(message: types.Message, state: FSMContext):
    if message.text in CANCEL_TEXTS:
        await state.clear()
        await message.answer("❌ Bekor qilindi.", reply_markup=remove_keyboard())
        return
    await state.update_data(image_file_id=None)
    await _show_item_confirm(message, state)


async def _show_item_confirm(message: types.Message, state: FSMContext):
    data = await state.get_data()
    await message.answer(
        f"✅ <b>Tasdiqlang:</b>\n\n"
        f"📌 Nomi: <b>{data.get('name')}</b>\n"
        f"📝 Tavsif: {data.get('description') or '—'}\n"
        f"💰 Narx: <b>{data.get('price', 0):,.0f} so'm</b>\n"
        f"🖼 Rasm: {'✅' if data.get('image_file_id') else '—'}",
        reply_markup=confirm_keyboard("newitem")
    )
    await state.set_state(MenuItemStates.confirm)


@router.callback_query(MenuItemStates.confirm, F.data.startswith("newitem_"))
async def add_item_save(callback: types.CallbackQuery, state: FSMContext):
    if callback.data == "newitem_no":
        await state.clear()
        await callback.message.answer("❌ Bekor qilindi.", reply_markup=remove_keyboard())
        await callback.answer()
        return

    data = await state.get_data()
    restaurant = await get_owner_restaurant(callback.from_user.id)

    async with async_session() as session:
        item = MenuItem(
            restaurant_id = restaurant.id,
            category_id   = data.get("category_id"),
            name          = data.get("name"),
            description   = data.get("description"),
            price         = data.get("price", 0),
            image_file_id = data.get("image_file_id"),
            is_available  = True,
        )
        session.add(item)
        await session.commit()

    await state.clear()
    await callback.message.answer(
        f"🎉 <b>'{data.get('name')}'</b> menyuga qo'shildi!",
        reply_markup=remove_keyboard()
    )
    await callback.answer("✅ Saqlandi!")


# ═══════════════════════════════════════════════════════════════════════
# TAOMLAR RO'YXATI + BOSHQARUV
# ═══════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "menu_list_items")
async def list_menu_items(callback: types.CallbackQuery, state: FSMContext):
    restaurant = await get_owner_restaurant(callback.from_user.id)
    if not restaurant:
        await callback.answer("Restoran topilmadi!", show_alert=True)
        return

    async with async_session() as session:
        items_r = await session.execute(
            select(MenuItem).where(MenuItem.restaurant_id == restaurant.id)
            .order_by(MenuItem.category_id, MenuItem.sort_order)
        )
        items = items_r.scalars().all()

    if not items:
        await callback.message.answer("📭 Menyuda hali taomlar yo'q.")
        await callback.answer()
        return

    await callback.message.answer(f"📋 <b>Barcha taomlar ({len(items)} ta):</b>")

    for item in items[:20]:  # Limit 20
        avail = "🟢" if item.is_available else "🔴"
        text = (
            f"{avail} <b>{item.name}</b>\n"
            f"💰 {float(item.price):,.0f} so'm"
        )
        kb = menu_item_manage_keyboard(item.id, item.is_available)
        if item.image_file_id:
            await callback.message.answer_photo(
                item.image_file_id, caption=text, reply_markup=kb
            )
        else:
            await callback.message.answer(text, reply_markup=kb)

    await callback.answer()


@router.callback_query(F.data.startswith("item_toggle_"))
async def toggle_item_availability(callback: types.CallbackQuery):
    item_id = int(callback.data.split("_")[2])

    async with async_session() as session:
        result = await session.execute(select(MenuItem).where(MenuItem.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            await callback.answer("Taom topilmadi!", show_alert=True)
            return
        item.is_available = not item.is_available
        await session.commit()
        status = "🟢 Yoqildi" if item.is_available else "🔴 O'chirildi"
        await callback.answer(f"{item.name}: {status}")
        try:
            await callback.message.edit_reply_markup(
                reply_markup=menu_item_manage_keyboard(item_id, item.is_available)
            )
        except Exception:
            pass


@router.callback_query(F.data.startswith("item_delete_"))
async def delete_item_confirm(callback: types.CallbackQuery):
    item_id = int(callback.data.split("_")[2])
    await callback.message.answer(
        "🗑 Haqiqatan bu taomni o'chirmoqchimisiz?",
        reply_markup=confirm_keyboard(f"itemdel_{item_id}")
    )
    await callback.answer()


@router.callback_query(F.data.startswith("itemdel_"))
async def delete_item_execute(callback: types.CallbackQuery):
    parts = callback.data.split("_")
    item_id = int(parts[1])
    confirmed = parts[2] == "yes"

    if not confirmed:
        await callback.message.delete()
        await callback.answer("Bekor qilindi.")
        return

    async with async_session() as session:
        result = await session.execute(select(MenuItem).where(MenuItem.id == item_id))
        item = result.scalar_one_or_none()
        if item:
            await session.delete(item)
            await session.commit()
            await callback.answer(f"🗑 '{item.name}' o'chirildi!")
        else:
            await callback.answer("Taom topilmadi!", show_alert=True)

    try:
        await callback.message.delete()
    except Exception:
        pass
