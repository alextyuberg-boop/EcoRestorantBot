from typing import List
import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import Restaurant, RestaurantOwner
from schemas import RestaurantCreate, RestaurantResponse, RestaurantUpdate
from .auth import get_current_owner

router = APIRouter(prefix="/api/restaurants", tags=["restaurants"])

@router.get("/", response_model=List[RestaurantResponse])
async def get_my_restaurants(
    owner: RestaurantOwner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Restaurant).where(Restaurant.owner_id == owner.telegram_id))
    restaurants = result.scalars().all()
    return restaurants

from aiogram import Bot

@router.post("/", response_model=RestaurantResponse)
async def create_restaurant(
    restaurant_data: RestaurantCreate,
    owner: RestaurantOwner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    # Verify bot token
    try:
        temp_bot = Bot(token=restaurant_data.bot_token)
        bot_info = await temp_bot.get_me()
        await temp_bot.session.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid bot token")
        
    # Check if a restaurant with the same bot_token exists
    result = await db.execute(select(Restaurant).where(Restaurant.bot_token == restaurant_data.bot_token))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Bot token already in use")
        
    new_restaurant = Restaurant(
        owner_id=owner.telegram_id,
        name=restaurant_data.name,
        bot_token=restaurant_data.bot_token,
        bot_username=bot_info.username
    )
    db.add(new_restaurant)
    await db.commit()
    await db.refresh(new_restaurant)
    return new_restaurant

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: int,
    owner: RestaurantOwner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner.telegram_id
        )
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@router.patch("/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    owner: RestaurantOwner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner.telegram_id
        )
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    update_data = restaurant_data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(restaurant, key, value)
        
    await db.commit()
    await db.refresh(restaurant)
    
    # If bot token changes or status changes, we could re-register in bot_manager,
    # but here they are just updating branding and settings.
    return restaurant


@router.post("/upload")
async def upload_restaurant_file(
    request: Request,
    file: UploadFile = File(...),
    owner: RestaurantOwner = Depends(get_current_owner)
):
    # Ensure static directory exists
    os.makedirs("static/uploads", exist_ok=True)
    
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Faqat rasm fayllari yuklanishi mumkin (.jpg, .png, .webp, etc.)")
        
    # Generate unique filename
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("static", "uploads", filename)
    
    # Save the file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Generate complete URL using request.base_url
    base_url = str(request.base_url).rstrip("/")
    file_url = f"{base_url}/static/uploads/{filename}"
    
    return {"url": file_url}

