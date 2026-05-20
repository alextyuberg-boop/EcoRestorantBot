import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    ForeignKey, JSON, DateTime, Enum, Text, BigInteger, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ── Enums ──────────────────────────────────────────────────────────────

class OrderStatus(enum.Enum):
    new        = "new"
    confirmed  = "confirmed"
    paid       = "paid"
    cooking    = "cooking"
    delivery   = "delivery"
    done       = "done"
    cancelled  = "cancelled"

class PaymentType(enum.Enum):
    cash    = "cash"
    payme   = "payme"
    click   = "click"
    uzum    = "uzum"
    paynet  = "paynet"

class WithdrawalStatus(enum.Enum):
    pending  = "pending"
    sent     = "sent"
    rejected = "rejected"

class UserLanguage(enum.Enum):
    uz = "uz"
    ru = "ru"
    en = "en"


# ── RestaurantOwner ────────────────────────────────────────────────────

class RestaurantOwner(Base):
    __tablename__ = "restaurant_owners"

    telegram_id = Column(BigInteger, primary_key=True, index=True)
    full_name   = Column(String, nullable=True)
    phone       = Column(String, nullable=True)
    card_number = Column(String, nullable=True)          # full number stored
    balance     = Column(Numeric(14, 2), default=0.0)
    language    = Column(Enum(UserLanguage), default=UserLanguage.uz)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    restaurants = relationship("Restaurant", back_populates="owner")
    withdrawals = relationship("Withdrawal", back_populates="owner")


# ── Restaurant ─────────────────────────────────────────────────────────

class Restaurant(Base):
    __tablename__ = "restaurants"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    owner_id      = Column(BigInteger, ForeignKey("restaurant_owners.telegram_id"))
    name          = Column(String, nullable=False)
    address       = Column(String, nullable=True)
    bot_token     = Column(String, nullable=False, unique=True)
    bot_username  = Column(String, nullable=True)
    bot_id        = Column(BigInteger, nullable=True)

    # Settings
    delivery_fee  = Column(Numeric(12, 2), default=0.0)
    min_order     = Column(Numeric(12, 2), default=0.0)
    working_start = Column(String, nullable=True)        # "09:00"
    working_end   = Column(String, nullable=True)        # "22:00"
    is_active     = Column(Boolean, default=True)
    settings      = Column(JSON, default={})             # extra settings

    # Branding
    primary_color = Column(String, default="#00E561")
    theme         = Column(String, default="dark")
    logo_file_id  = Column(String, nullable=True)        # Telegram file_id
    logo_url      = Column(String, nullable=True)        # Logo URL

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    owner      = relationship("RestaurantOwner", back_populates="restaurants")
    categories = relationship("MenuCategory", back_populates="restaurant", cascade="all, delete-orphan")
    orders     = relationship("Order", back_populates="restaurant")


# ── MenuCategory ───────────────────────────────────────────────────────

class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"))
    name          = Column(String, nullable=False)
    sort_order    = Column(Integer, default=0)

    restaurant = relationship("Restaurant", back_populates="categories")
    items      = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


# ── MenuItem ───────────────────────────────────────────────────────────

class MenuItem(Base):
    __tablename__ = "menu_items"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"))
    category_id   = Column(Integer, ForeignKey("menu_categories.id", ondelete="SET NULL"), nullable=True)
    name          = Column(String, nullable=False)
    description   = Column(Text, nullable=True)
    price         = Column(Numeric(12, 2), nullable=False)
    image_file_id = Column(String, nullable=True)        # Telegram file_id (preferred)
    image_url     = Column(String, nullable=True)        # fallback URL
    is_available  = Column(Boolean, default=True)
    sort_order    = Column(Integer, default=0)

    category = relationship("MenuCategory", back_populates="items")


# ── User (Mijoz) ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    telegram_id   = Column(BigInteger, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    full_name     = Column(String, nullable=True)
    phone         = Column(String, nullable=True)
    language      = Column(Enum(UserLanguage), default=UserLanguage.uz)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")


# ── Order ──────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id   = Column(Integer, ForeignKey("restaurants.id"))
    user_id         = Column(BigInteger, ForeignKey("users.telegram_id"))
    status          = Column(Enum(OrderStatus), default=OrderStatus.new)
    items           = Column(JSON, nullable=False)       # [{item_id, name, qty, price}]
    total_amount    = Column(Numeric(14, 2), nullable=False)
    delivery_fee    = Column(Numeric(12, 2), default=0.0)

    # Delivery info
    delivery_address = Column(String, nullable=True)
    location_lat     = Column(Float, nullable=True)
    location_lon     = Column(Float, nullable=True)
    phone            = Column(String, nullable=True)

    # Payment
    payment_type     = Column(Enum(PaymentType), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    restaurant   = relationship("Restaurant", back_populates="orders")
    user         = relationship("User", back_populates="orders")
    transactions = relationship("Transaction", back_populates="order")


# ── Transaction ────────────────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    order_id              = Column(Integer, ForeignKey("orders.id"))
    provider              = Column(String, nullable=False)   # payme, click, uzum, paynet
    amount                = Column(Numeric(14, 2), nullable=False)
    status                = Column(String, default="pending")
    provider_transaction_id = Column(String, nullable=True)
    paid_at               = Column(DateTime(timezone=True), nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="transactions")


# ── Withdrawal ─────────────────────────────────────────────────────────

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    owner_id    = Column(BigInteger, ForeignKey("restaurant_owners.telegram_id"))
    amount      = Column(Numeric(14, 2), nullable=False)
    card_number = Column(String, nullable=False)
    status      = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.pending)
    note        = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("RestaurantOwner", back_populates="withdrawals")
