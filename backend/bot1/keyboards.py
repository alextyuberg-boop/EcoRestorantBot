"""
Bot 1 — Keyboards (barcha keyboard funksiyalari)
"""
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
)


# ── Matnlar (i18n) ─────────────────────────────────────────────────────

TEXTS = {
    "share_phone_btn": {
        "uz": "📞 Raqamni ulashish",
        "ru": "📞 Поделиться номером",
        "en": "📞 Share phone number",
    },
    "my_restaurant_btn": {
        "uz": "🏪 Restoranim",
        "ru": "🏪 Мой ресторан",
        "en": "🏪 My Restaurant",
    },
    "change_lang_btn": {
        "uz": "🌐 Til o'zgartirish",
        "ru": "🌐 Сменить язык",
        "en": "🌐 Change Language",
    },
    "disconnect_btn": {
        "uz": "❌ Botni uzish",
        "ru": "❌ Отключить бот",
        "en": "❌ Disconnect bot",
    },
    "back_btn": {
        "uz": "⬅️ Ortga",
        "ru": "⬅️ Назад",
        "en": "⬅️ Back",
    },
}


def t(key: str, lang: str) -> str:
    """Matnni tanlangan tilda qaytaradi."""
    return TEXTS.get(key, {}).get(lang, TEXTS.get(key, {}).get("uz", key))


# ── Til tanlash ────────────────────────────────────────────────────────

def lang_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="lang_uz")],
            [InlineKeyboardButton(text="🇷🇺 Русский",   callback_data="lang_ru")],
            [InlineKeyboardButton(text="🇬🇧 English",   callback_data="lang_en")],
        ]
    )


# ── Telefon ulashish ───────────────────────────────────────────────────

def phone_keyboard(lang: str) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t("share_phone_btn", lang), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def remove_keyboard() -> ReplyKeyboardRemove:
    return ReplyKeyboardRemove()


# ── Asosiy menyu ───────────────────────────────────────────────────────

def main_menu_keyboard(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("my_restaurant_btn", lang), callback_data="menu_restaurant")],
            [InlineKeyboardButton(text=t("change_lang_btn", lang),   callback_data="menu_change_lang")],
        ]
    )


# ── Restoran ma'lumoti (bot ulangan holat) ─────────────────────────────

def restaurant_connected_keyboard(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("disconnect_btn", lang), callback_data="restaurant_disconnect")],
            [InlineKeyboardButton(text=t("back_btn", lang),       callback_data="menu_back")],
        ]
    )


# ── Bot ulanmagan holat (token kiritish) ───────────────────────────────

def no_restaurant_keyboard(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("back_btn", lang), callback_data="menu_back")],
        ]
    )
