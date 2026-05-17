"""
API — Zakaz yaratish va boshqarish.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from pydantic import BaseModel

from database import get_db
from models import Order, OrderStatus, Restaurant
from routers.auth import get_current_owner

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ── Schemas ────────────────────────────────────────────────────────────

class CartItem(BaseModel):
    item_id: int
    name:    str
    qty:     int
    price:   float

class OrderCreate(BaseModel):
    restaurant_id:    int
    user_id:          int
    items:            List[CartItem]
    total_amount:     float
    phone:            Optional[str] = None
    delivery_address: Optional[str] = None
    location_lat:     Optional[float] = None
    location_lon:     Optional[float] = None
    payment_type:     Optional[str] = "cash"

class StatusUpdate(BaseModel):
    status: str


# ── Zakaz yaratish (Mini App orqali) ─────────────────────────────────

@router.post("/create", status_code=201)
async def create_order(
    body: OrderCreate,
    db:   AsyncSession = Depends(get_db)
):
    """
    Mijoz Mini App'dan keluvchi zakaz yaratish.
    JWT kerak emas — telegram_id cookie/header orqali emas,
    initData orqali user taniladi (kelajakda kengaytirilishi mumkin).
    Hozirda sodda variant: to'g'ridan-to'g'ri zakaz yaratadi.
    """
    from models import PaymentType
    try:
        payment_enum = PaymentType[body.payment_type or "cash"]
    except KeyError:
        payment_enum = PaymentType.cash

    order = Order(
        restaurant_id    = body.restaurant_id,
        user_id          = body.user_id,
        status           = OrderStatus.new,
        items            = [item.model_dump() for item in body.items],
        total_amount     = body.total_amount,
        phone            = body.phone,
        delivery_address = body.delivery_address,
        location_lat     = body.location_lat,
        location_lon     = body.location_lon,
        payment_type     = payment_enum,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # ── Egaga va Mijozga Telegram Bildirishnomalarini yuborish ──
    try:
        import os
        from aiogram import Bot
        from bot_manager import active_bots
        
        # Restoranni va uning egasini yuklash
        res_query = await db.execute(select(Restaurant).where(Restaurant.id == body.restaurant_id))
        restaurant = res_query.scalar_one_or_none()
        if restaurant:
            # 1. Mijozga tasdiqlash xabarnomasi (restoran boti orqali)
            cust_bot = None
            if restaurant.bot_token in active_bots:
                cust_bot = active_bots[restaurant.bot_token]
            else:
                cust_bot = Bot(token=restaurant.bot_token)
            
            confirm_msg = (
                f"🎉 <b>Buyurtmangiz qabul qilindi!</b>\n\n"
                f"📋 Buyurtma #{order.id}\n"
                f"💰 Jami: <b>{float(order.total_amount):,.0f} so'm</b>\n"
                f"💳 To'lov turi: {body.payment_type.upper() if body.payment_type else 'CASH'}\n\n"
                f"Restoran tasdiqlagach xabar yuboriladi."
            )
            try:
                await cust_bot.send_message(body.user_id, confirm_msg)
            except Exception:
                pass
            finally:
                if restaurant.bot_token not in active_bots:
                    await cust_bot.session.close()

            # 2. Restoran egasiga platform boti orqali bildirishnoma
            platform_token = os.getenv("PLATFORM_BOT_TOKEN", "")
            if platform_token:
                platform_bot = None
                if platform_token in active_bots:
                    platform_bot = active_bots[platform_token]
                else:
                    platform_bot = Bot(token=platform_token)
                
                from bot_notifier import notify_owner_new_order
                await notify_owner_new_order(
                    platform_bot,
                    restaurant.owner_id,
                    {
                        "id": order.id,
                        "items": [item.model_dump() for item in body.items],
                        "total_amount": float(order.total_amount),
                        "phone": body.phone,
                        "delivery_address": body.delivery_address,
                        "location_lat": body.location_lat,
                        "location_lon": body.location_lon,
                        "payment_type": body.payment_type or "cash",
                    }
                )
                if platform_token not in active_bots:
                    await platform_bot.session.close()
    except Exception:
        pass

    return {"id": order.id, "status": order.status.value}


# ── Zakaz holati (ommaviy) ─────────────────────────────────────────────

@router.get("/{order_id}")
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Zakaz topilmadi.")
    return {
        "id":           order.id,
        "status":       order.status.value,
        "total_amount": float(order.total_amount),
        "created_at":   order.created_at.isoformat() if order.created_at else None,
    }


# ── Admin: Zakaz ro'yxati ──────────────────────────────────────────────

@router.get("/admin/{restaurant_id}")
async def list_orders(
    restaurant_id: int,
    active_only:   bool = True,
    owner = Depends(get_current_owner),
    db:    AsyncSession = Depends(get_db)
):
    # Egalik tekshiruvi
    rest_r = await db.execute(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner.telegram_id
        )
    )
    if not rest_r.scalar_one_or_none():
        raise HTTPException(403, "Bu restoran sizga tegishli emas.")

    query = select(Order).where(Order.restaurant_id == restaurant_id)
    if active_only:
        query = query.where(Order.status.in_([
            OrderStatus.new, OrderStatus.confirmed,
            OrderStatus.paid, OrderStatus.cooking, OrderStatus.delivery
        ]))

    result = await db.execute(query.order_by(desc(Order.created_at)).limit(50))
    orders = result.scalars().all()

    return [
        {
            "id":           o.id,
            "status":       o.status.value,
            "total_amount": float(o.total_amount),
            "items":        o.items,
            "phone":        o.phone,
            "payment_type": o.payment_type.value if o.payment_type else None,
            "created_at":   o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


# ── Admin: Zakaz holatini yangilash ───────────────────────────────────

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id:    int,
    body:        StatusUpdate,
    owner = Depends(get_current_owner),
    db:   AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Zakaz topilmadi.")

    # Egalik tekshiruvi
    rest_r = await db.execute(
        select(Restaurant).where(
            Restaurant.id == order.restaurant_id,
            Restaurant.owner_id == owner.telegram_id
        )
    )
    if not rest_r.scalar_one_or_none():
        raise HTTPException(403, "Ruxsat yo'q.")

    try:
        new_status = OrderStatus[body.status]
    except KeyError:
        raise HTTPException(400, f"Noto'g'ri status: {body.status}")

    order.status = new_status
    await db.commit()

    # Mijozga bildirishnoma (agar bot aktiv bo'lsa)
    try:
        from bot_manager import active_bots
        from bot_notifier import notify_customer_status
        rest = rest_r.scalar_one_or_none()
        if rest and rest.bot_token in active_bots:
            cust_bot = active_bots[rest.bot_token]
            await notify_customer_status(
                cust_bot, order.user_id, order.id, body.status
            )
    except Exception:
        pass

    return {"id": order.id, "status": new_status.value}
