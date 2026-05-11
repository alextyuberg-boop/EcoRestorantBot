import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

# Create async engine
connect_args = {
    "prepared_statement_cache_size": 0,
    "statement_cache_size": 0,
}
if "localhost" not in DATABASE_URL:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    connect_args=connect_args
)

# Create session factory
async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Declarative base
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
