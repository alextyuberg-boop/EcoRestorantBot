from pydantic import BaseModel
from typing import Optional

class RestaurantCreate(BaseModel):
    name: str
    bot_token: str
    owner_id: Optional[int] = None

class RestaurantResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    bot_username: Optional[str] = None
    address: Optional[str] = None
    primary_color: Optional[str] = None
    theme: Optional[str] = None
    logo_file_id: Optional[str] = None
    logo_url: Optional[str] = None
    delivery_fee: float = 0.0
    min_order: float = 0.0
    working_start: Optional[str] = None
    working_end: Optional[str] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    primary_color: Optional[str] = None
    theme: Optional[str] = None
    logo_file_id: Optional[str] = None
    logo_url: Optional[str] = None
    delivery_fee: Optional[float] = None
    min_order: Optional[float] = None
    working_start: Optional[str] = None
    working_end: Optional[str] = None
    is_active: Optional[bool] = None

