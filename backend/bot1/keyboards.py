"""
Bot 1 — Klaviatura (keyboard) yaratuvchi yordamchi modul.
Barcha ReplyKeyboard va InlineKeyboard shu faylda.
"""
from aiogram.types import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardRemove,
)


# ── Til tanlash (onboarding) ──────────────────────────────────────────

def lang_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🇺🇿 O'zbek",  callback_data="lang_uz"),
            InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru"),
            InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en"),
        ]
    ])


# ── Telefon so'rash ───────────────────────────────────────────────────

def phone_request_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📞 Raqamni ulashish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


# ── Asosiy menyu (Bot 1) ──────────────────────────────────────────────

_MAIN_MENU_UZ = [
    ["📦 Zakazlar",    "🍽 Menyu"],
    ["💳 Karta ulash", "📊 Statistika"],
    ["🤖 Botimni sozla"],
    ["👤 Profil",      "⚙️ Sozlamalar"],
]

_MAIN_MENU_RU = [
    ["📦 Заказы",      "🍽 Меню"],
    ["💳 Привязать карту", "📊 Статистика"],
    ["🤖 Настроить бота"],
    ["👤 Профиль",     "⚙️ Настройки"],
]

def main_menu_keyboard(lang: str = "uz") -> ReplyKeyboardMarkup:
    buttons = _MAIN_MENU_RU if lang == "ru" else _MAIN_MENU_UZ
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t) for t in row] for row in buttons],
        resize_keyboard=True,
    )


# ── Bekor qilish tugmasi ──────────────────────────────────────────────

def cancel_keyboard(lang: str = "uz") -> ReplyKeyboardMarkup:
    text = "❌ Bekor qilish" if lang != "ru" else "❌ Отмена"
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=text)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

def remove_keyboard() -> ReplyKeyboardRemove:
    return ReplyKeyboardRemove()


# ── O'tkazib yuborish (ixtiyoriy qadamlar) ───────────────────────────

def skip_keyboard(lang: str = "uz") -> ReplyKeyboardMarkup:
    text = "⏭ O'tkazib yuborish" if lang != "ru" else "⏭ Пропустить"
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=text)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


# ── Tasdiqlash inline keyboard ────────────────────────────────────────

def confirm_keyboard(prefix: str = "confirm") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Ha, saqlash",    callback_data=f"{prefix}_yes"),
            InlineKeyboardButton(text="❌ Bekor",          callback_data=f"{prefix}_no"),
        ]
    ])


# ── Zakaz status inline keyboard ─────────────────────────────────────

def order_status_keyboard(order_id: int, current_status: str) -> InlineKeyboardMarkup:
    STATUS_FLOW = {
        "new":       ("confirmed", "✅ Qabul qildim"),
        "confirmed": ("cooking",   "👨‍🍳 Tayyorlanmoqda"),
        "cooking":   ("delivery",  "🚴 Yo'lga chiqdi"),
        "delivery":  ("done",      "✔️ Yetkazildi"),
    }
    buttons = []

    next_status = STATUS_FLOW.get(current_status)
    if next_status:
        status_code, label = next_status
        buttons.append(InlineKeyboardButton(
            text=label,
            callback_data=f"order_status_{order_id}_{status_code}"
        ))

    buttons.append(InlineKeyboardButton(
        text="❌ Bekor qilish",
        callback_data=f"order_status_{order_id}_cancelled"
    ))

    return InlineKeyboardMarkup(inline_keyboard=[buttons])


# ── Kategoriya tanlash ────────────────────────────────────────────────

def categories_keyboard(categories: list, prefix: str = "cat") -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(
            text=cat.name,
            callback_data=f"{prefix}_{cat.id}"
        )]
        for cat in categories
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


# ── Taomlar boshqaruv keyboard ─────────────────────────────────────────

def menu_item_manage_keyboard(item_id: int, is_available: bool) -> InlineKeyboardMarkup:
    toggle_text = "🔴 O'chirish" if is_available else "🟢 Yoqish"
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✏️ Tahrirlash",   callback_data=f"item_edit_{item_id}"),
            InlineKeyboardButton(text=toggle_text,        callback_data=f"item_toggle_{item_id}"),
        ],
        [
            InlineKeyboardButton(text="🗑 O'chirish",     callback_data=f"item_delete_{item_id}"),
        ],
    ])
