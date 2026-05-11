from pydantic import BaseModel
from typing import Optional

class RestaurantCreate(BaseModel):
    owner_id: int
    name: str
    bot_token: str

class RestaurantResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    bot_username: Optional[str] = None
    
    class Config:
        from_attributes = True
