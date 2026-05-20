from aiogram.fsm.state import State, StatesGroup

class OnboardingStates(StatesGroup):
    """Registration and bot linking flow"""
    language  = State()    # Language selection
    bot_token = State()    # Bot API Token from @BotFather
    support_issue = State() # Support issue message
