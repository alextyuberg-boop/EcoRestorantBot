"""
Bot 1 — @EcoRestaurant_Bot
FSM holatlari (State Machine) — onboarding va menyu boshqaruvi uchun.
"""
from aiogram.fsm.state import State, StatesGroup


class OnboardingStates(StatesGroup):
    """Ro'yxatdan o'tish jarayoni — til tanlovdan boshlanadi."""
    language        = State()    # Til tanlash (uz/ru/en)
    owner_name      = State()    # To'liq ism kiritish
    restaurant_name = State()    # Restoran nomi
    address         = State()    # Manzil
    phone           = State()    # Telefon raqami


class MenuCategoryStates(StatesGroup):
    """Kategoriya qo'shish/tahrirlash."""
    name = State()               # Kategoriya nomi


class MenuItemStates(StatesGroup):
    """Taom qo'shish/tahrirlash — 6 ta qadam."""
    category = State()           # Kategoriya tanlash
    name     = State()           # Taom nomi
    desc     = State()           # Tavsif (ixtiyoriy)
    price    = State()           # Narx (so'mda)
    image    = State()           # Rasm (ixtiyoriy)
    confirm  = State()           # Tasdiqlash


class CardStates(StatesGroup):
    """Karta ulash."""
    card_number = State()        # 16 xonali karta raqami


class BotSetupStates(StatesGroup):
    """Bot 2 (mijoz boti) o'rnatish — token kiritish."""
    token = State()              # @BotFather dan olingan token


class OrderFilterStates(StatesGroup):
    """Zakaz filtr davri (ixtiyoriy)."""
    period = State()             # bugun/hafta/oy
