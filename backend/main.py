"""
EcoRestaurant Platform — FastAPI asosiy fayl
- Bot 1 (@EcoRestaurant_Bot) — egalar boti
- Dinamik Bot 2 — har restoran uchun shablon (bot_manager orqali)
- REST API — Mini App uchun
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from aiogram import Bot, Dispatcher, types
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from dotenv import load_dotenv

from database import async_session, engine, Base
import models  # noqa: F401 — tablitsa yaratish uchun kerak
from routers import auth, restaurants
from api.menu import router as menu_router
from api.orders import router as orders_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ── Bot 1 init ─────────────────────────────────────────────────────────

PLATFORM_TOKEN = os.getenv("PLATFORM_BOT_TOKEN", "")
if not PLATFORM_TOKEN:
    raise ValueError("PLATFORM_BOT_TOKEN .env da topilmadi!")

platform_bot = Bot(
    token=PLATFORM_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
platform_dp = Dispatcher()

# Bot 1 handler'larini ulash
from bot1.handlers.start    import router as start_router
from bot1.handlers.orders   import router as orders_bot_router
from bot1.handlers.menu_mgmt import router as menu_mgmt_router
from bot1.handlers.bot_setup import router as bot_setup_router
from bot1.handlers.card     import router as card_router
from bot1.handlers.profile  import router as profile_router

platform_dp.include_router(start_router)
platform_dp.include_router(orders_bot_router)
platform_dp.include_router(menu_mgmt_router)
platform_dp.include_router(bot_setup_router)
platform_dp.include_router(card_router)
platform_dp.include_router(profile_router)


# ── Lifespan: ishga tushish va o'chirish ──────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Jadvallarni yaratish (agar yo'q bo'lsa)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database jadvallari tekshirildi.")

    # 2. Bot 1 webhook o'rnatish
    base_url = os.getenv("BASE_URL", "")
    if base_url:
        webhook_url = f"{base_url}/bot1/webhook"
        await platform_bot.set_webhook(webhook_url)
        logger.info(f"Bot 1 webhook o'rnatildi: {webhook_url}")
    else:
        # LOCAL DEV: polling rejimi
        logger.warning("BASE_URL yo'q — Bot 1 polling rejimida ishlamoqda")
        polling_task = asyncio.create_task(platform_dp.start_polling(platform_bot))

    # 3. DB dan barcha aktiv restoran botlarini yuklash
    from bot_manager import load_all_restaurant_bots
    await load_all_restaurant_bots()

    yield  # App ishlaydi

    # Shutdown
    logger.info("Server o'chirilmoqda...")
    await platform_bot.session.close()
    if not base_url:
        polling_task.cancel()


# ── FastAPI app ────────────────────────────────────────────────────────

app = FastAPI(
    title="EcoRestaurant Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — Mini App (Vercel) uchun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da aniq Vercel URL qo'ying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routerlar ──────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(menu_router)
app.include_router(orders_router)


# ── Webhook endpointlar ────────────────────────────────────────────────

@app.post("/bot1/webhook")
async def bot1_webhook(request: Request):
    """Bot 1 (@EcoRestaurant_Bot) uchun Telegram webhook endpoint."""
    try:
        data = await request.json()
        update = types.Update(**data)
        await platform_dp.feed_update(platform_bot, update)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Bot 1 webhook xatosi: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bot/{token}")
async def restaurant_bot_webhook(token: str, request: Request):
    """
    Barcha restoran botlari uchun umumiy webhook endpoint.
    Har bir bot o'z token'i bilan shu yerga keladi.
    """
    from bot_manager import active_bots, active_dps

    bot = active_bots.get(token)
    dp  = active_dps.get(token)

    if not bot or not dp:
        raise HTTPException(status_code=404, detail="Bot topilmadi yoki faol emas.")

    try:
        data = await request.json()
        update = types.Update(**data)
        await dp.feed_update(bot, update)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Restaurant bot webhook xatosi (token={token[:10]}...): {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Health check ───────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "EcoRestaurant API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    from bot_manager import active_bots
    return {
        "status": "ok",
        "active_bots": len(active_bots),
    }
