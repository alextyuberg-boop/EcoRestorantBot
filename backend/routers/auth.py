import os
import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import RestaurantOwner

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class TelegramAuthRequest(BaseModel):
    initData: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def verify_telegram_web_app_data(init_data: str, bot_token: str) -> dict:
    """Verifies the telegram web app initData and returns the user payload."""
    try:
        parsed_data = dict(parse_qsl(init_data))
        if "hash" not in parsed_data:
            return None
            
        hash_val = parsed_data.pop("hash")
        
        # Sort data
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        
        # Create secret key
        secret_key = hmac.new(
            "WebAppData".encode(), bot_token.encode(), hashlib.sha256
        ).digest()
        
        # Calculate signature
        signature = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()
        
        if signature != hash_val:
            return None
            
        # Optional: Check auth_date for expiration (e.g., max 24h old)
        if "auth_date" in parsed_data:
            auth_date = int(parsed_data["auth_date"])
            if datetime.now().timestamp() - auth_date > 86400:
                return None
                
        user_data = json.loads(parsed_data.get("user", "{}"))
        return user_data
    except Exception as e:
        print(f"Error verifying telegram data: {e}")
        return None

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/telegram", response_model=TokenResponse)
async def login_via_telegram(request: TelegramAuthRequest, db: AsyncSession = Depends(get_db)):
    bot_token = os.getenv("PLATFORM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="Bot token not configured")
        
    user_data = verify_telegram_web_app_data(request.initData, bot_token)
    
    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data",
        )
        
    telegram_id = user_data["id"]
    
    # Check if owner exists
    result = await db.execute(select(RestaurantOwner).where(RestaurantOwner.telegram_id == telegram_id))
    owner = result.scalars().first()
    
    if not owner:
        # Create new owner
        owner = RestaurantOwner(
            telegram_id=telegram_id,
            full_name=f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Unknown",
            phone=None,
        )
        db.add(owner)
        await db.commit()
        await db.refresh(owner)
        
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(owner.telegram_id), "role": "owner"}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "telegram_id": owner.telegram_id,
            "full_name": owner.full_name,
            "balance": owner.balance,
        }
    }

class CustomerAuthRequest(BaseModel):
    initData: str
    restaurant_id: int

@router.post("/customer", response_model=TokenResponse)
async def login_customer_via_telegram(request: CustomerAuthRequest, db: AsyncSession = Depends(get_db)):
    from models import Restaurant, User
    
    # Get the restaurant to find its bot token
    result = await db.execute(select(Restaurant).where(Restaurant.id == request.restaurant_id))
    restaurant = result.scalars().first()
    
    if not restaurant or not restaurant.is_active:
        raise HTTPException(status_code=404, detail="Restaurant not found or inactive")
        
    bot_token = restaurant.bot_token
    user_data = verify_telegram_web_app_data(request.initData, bot_token)
    
    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data for customer",
        )
        
    telegram_id = user_data["id"]
    
    # Check if user exists
    user_r = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = user_r.scalars().first()
    
    if not user:
        from models import UserLanguage
        user = User(
            telegram_id=telegram_id,
            full_name=f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Unknown",
            restaurant_id=restaurant.id,
            language=UserLanguage.uz
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.telegram_id), "role": "customer", "restaurant_id": restaurant.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "telegram_id": user.telegram_id,
            "full_name": user.full_name,
            "restaurant_id": user.restaurant_id,
            "balance": "0.00" # Users don't have balance in the model right now
        }
    }

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_owner(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> RestaurantOwner:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "owner":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an owner")
        telegram_id_str: str = payload.get("sub")
        if telegram_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        telegram_id = int(telegram_id_str)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        
    result = await db.execute(select(RestaurantOwner).where(RestaurantOwner.telegram_id == telegram_id))
    owner = result.scalars().first()
    if owner is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner not found")
        
    return owner

async def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    from models import User
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "customer":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a customer")
        telegram_id_str: str = payload.get("sub")
        if telegram_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        telegram_id = int(telegram_id_str)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    return user
