"""
Bot 2 — FSM holatlari (Mijoz boti).
"""
from aiogram.fsm.state import State, StatesGroup


class OrderStates(StatesGroup):
    """Zakaz berish jarayoni."""
    phone    = State()    # Telefon raqami
    location = State()    # Lokatsiya yoki manzil (matn)
    payment  = State()    # To'lov usuli tanlash
    confirm  = State()    # Tasdiqlash
