"""
API — Menyu CRUD (kategoriyalar va taomlar).
Admin Mini App va Bot 1 handler'lari shu endpoint'lardan foydalanadi.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models import MenuCategory, MenuItem, Restaurant
from routers.auth import get_current_owner

router = APIRouter(prefix="/api/menu", tags=["menu"])


# ── Schemas ────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0

class ItemCreate(BaseModel):
    category_id:  Optional[int] = None
    name:         str
    description:  Optional[str] = None
    price:        float
    image_file_id: Optional[str] = None
    image_url:    Optional[str] = None
    is_available: bool = True

class ItemUpdate(BaseModel):
    name:         Optional[str] = None
    description:  Optional[str] = None
    price:        Optional[float] = None
    image_file_id: Optional[str] = None
    image_url:    Optional[str] = None
    is_available: Optional[bool] = None
    category_id:  Optional[int] = None


# ── Yordamchi: eganing restoran ID'sini olish ─────────────────────────

async def _get_owner_restaurant(owner, restaurant_id: int, db: AsyncSession) -> Restaurant:
    result = await db.execute(
        select(Restaurant).where(
            and_(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner.telegram_id
            )
        )
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=403, detail="Bu restoran sizga tegishli emas.")
    return restaurant


# ════════════════════════════════════════════════════════════════════════
# OMMAVIY ENDPOINT — Mini App uchun (autentifikatsiya shart emas)
# ════════════════════════════════════════════════════════════════════════

@router.get("/{restaurant_id}")
async def get_public_menu(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    """
    Mijoz Mini App uchun: restoran menyusini kategoriyalar + taomlar bilan qaytaradi.
    """
    cats_result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.restaurant_id == restaurant_id)
        .order_by(MenuCategory.sort_order)
    )
    categories = cats_result.scalars().all()

    result = []
    for cat in categories:
        items_result = await db.execute(
            select(MenuItem).where(
                and_(
                    MenuItem.category_id == cat.id,
                    MenuItem.is_available == True
                )
            ).order_by(MenuItem.sort_order)
        )
        items = items_result.scalars().all()
        result.append({
            "id":    cat.id,
            "name":  cat.name,
            "items": [
                {
                    "id":           item.id,
                    "name":         item.name,
                    "description":  item.description,
                    "price":        float(item.price),
                    "image_url":    item.image_url,
                    "image_file_id": item.image_file_id,
                }
                for item in items
            ]
        })

    return result


# ════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTLAR — egalar uchun (JWT kerak)
# ════════════════════════════════════════════════════════════════════════

# ── Kategoriyalar ──────────────────────────────────────────────────────

@router.get("/admin/{restaurant_id}/categories")
async def list_categories(
    restaurant_id: int,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    await _get_owner_restaurant(owner, restaurant_id, db)
    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.restaurant_id == restaurant_id)
        .order_by(MenuCategory.sort_order)
    )
    cats = result.scalars().all()
    return [{"id": c.id, "name": c.name, "sort_order": c.sort_order} for c in cats]


@router.post("/admin/{restaurant_id}/categories", status_code=201)
async def create_category(
    restaurant_id: int,
    body: CategoryCreate,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    await _get_owner_restaurant(owner, restaurant_id, db)
    cat = MenuCategory(restaurant_id=restaurant_id, **body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return {"id": cat.id, "name": cat.name}


@router.delete("/admin/categories/{cat_id}", status_code=204)
async def delete_category(
    cat_id: int,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MenuCategory).where(MenuCategory.id == cat_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(404, "Kategoriya topilmadi.")
    # Egalik tekshiruvi
    await _get_owner_restaurant(owner, cat.restaurant_id, db)
    await db.delete(cat)
    await db.commit()


# ── Taomlar ────────────────────────────────────────────────────────────

@router.get("/admin/{restaurant_id}/items")
async def list_items(
    restaurant_id: int,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    await _get_owner_restaurant(owner, restaurant_id, db)
    result = await db.execute(
        select(MenuItem).where(MenuItem.restaurant_id == restaurant_id)
        .order_by(MenuItem.category_id, MenuItem.sort_order)
    )
    items = result.scalars().all()
    return [
        {
            "id":           i.id,
            "name":         i.name,
            "description":  i.description,
            "price":        float(i.price),
            "category_id":  i.category_id,
            "is_available": i.is_available,
            "image_url":    i.image_url,
        }
        for i in items
    ]


@router.post("/admin/{restaurant_id}/items", status_code=201)
async def create_item(
    restaurant_id: int,
    body: ItemCreate,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    await _get_owner_restaurant(owner, restaurant_id, db)
    item = MenuItem(restaurant_id=restaurant_id, **body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": item.id, "name": item.name, "price": float(item.price)}


@router.put("/admin/items/{item_id}")
async def update_item(
    item_id: int,
    body: ItemUpdate,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Taom topilmadi.")
    await _get_owner_restaurant(owner, item.restaurant_id, db)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    return {"id": item.id, "name": item.name}


@router.delete("/admin/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Taom topilmadi.")
    await _get_owner_restaurant(owner, item.restaurant_id, db)
    await db.delete(item)
    await db.commit()
