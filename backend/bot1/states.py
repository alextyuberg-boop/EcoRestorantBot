from aiogram.fsm.state import State, StatesGroup

class OnboardingStates(StatesGroup):
    """Registration and bot linking flow"""
    language      = State()   # Til tanlash
    phone         = State()   # Telefon raqam kutish
    bot_token     = State()   # Bot API Token kiritish (@BotFather dan)
    support_issue = State()   # Yordam xabari
    change_lang   = State()   # Til o'zgartirish (asosiy menyudan)
