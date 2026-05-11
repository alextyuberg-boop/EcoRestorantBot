"""
Bot 2 — Asosiy Router. Har bir restoran uchun alohida instance.
bot_manager.py tomonidan chaqiriladi: get_customer_router(restaurant_id)
"""
from aiogram import Router

from bot2.handlers.start import get_start_router
from bot2.handlers.order import get_order_router


def get_customer_router(restaurant_id: int) -> Router:
    """
    Berilgan restaurant_id uchun to'liq mijoz boti router'ini qaytaradi.
    Barcha handler'lar restaurant_id ga bog'langan closure sifatida ishlaydi.
    """
    main_router = Router()

    main_router.include_router(get_start_router(restaurant_id))
    main_router.include_router(get_order_router(restaurant_id))

    return main_router
