import asyncio
import os
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import async_session, get_db
import models
import schemas
from routers import auth, restaurants

load_dotenv()

bot_token = os.getenv("PLATFORM_BOT_TOKEN")
if not bot_token:
    raise ValueError("PLATFORM_BOT_TOKEN is missing in .env")

# Initialize bot and dispatcher
bot = Bot(
    token=bot_token,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    # Register owner if not exists
    async with async_session() as session:
        stmt = select(models.RestaurantOwner).where(models.RestaurantOwner.telegram_id == message.from_user.id)
        result = await session.execute(stmt)
        owner = result.scalar_one_or_none()
        
        if not owner:
            new_owner = models.RestaurantOwner(
                telegram_id=message.from_user.id,
                full_name=message.from_user.full_name,
            )
            session.add(new_owner)
            await session.commit()

    # Here we will add a WebAppInfo button for the mini app
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")
    
    markup = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="📱 Tizimga kirish (Mini App)", 
                    web_app=types.WebAppInfo(url=mini_app_url)
                )
            ]
        ]
    )
    
    text = (
        "👋 <b>Assalomu alaykum!</b>\n\n"
        "EcoRestaurant platformasiga xush kelibsiz.\n"
        "Restoraningizni boshqarish uchun pastdagi tugmani bosing va mini-ilovaga kiring."
    )
    await message.answer(text, reply_markup=markup)

@asynccontextmanager
async def lifespan(app: FastAPI):
    mini_app_url = os.getenv("MINI_APP_URL", "https://yourapp.vercel.app")
    print(f"Bot is starting polling with MINI_APP_URL: {mini_app_url}")
    polling_task = asyncio.create_task(dp.start_polling(bot))
    yield
    print("Bot is shutting down...")
    polling_task.cancel()
    await bot.session.close()

app = FastAPI(title="EcoRestaurant Platform", lifespan=lifespan)

# Enable CORS for the frontend Mini App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(restaurants.router)

@app.get("/")
async def root():
    return {"message": "EcoRestaurant API is running"}


