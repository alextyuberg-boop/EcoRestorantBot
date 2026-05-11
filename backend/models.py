import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime, Enum, Text, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class OrderStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    cooking = "cooking"
    delivery = "delivery"
    done = "done"
    cancelled = "cancelled"

class WithdrawalStatus(enum.Enum):
    pending = "pending"
    sent = "sent"
    rejected = "rejected"

class RestaurantOwner(Base):
    __tablename__ = "restaurant_owners"

    telegram_id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    card_number = Column(String, nullable=True)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurants = relationship("Restaurant", back_populates="owner")
    withdrawals = relationship("Withdrawal", back_populates="owner")

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(BigInteger, ForeignKey("restaurant_owners.telegram_id"))
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    bot_token = Column(String, nullable=False, unique=True)
    bot_username = Column(String, nullable=True)
    delivery_fee = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Customization
    primary_color = Column(String, default="#0D9E75")

    owner = relationship("RestaurantOwner", back_populates="restaurants")
    categories = relationship("MenuCategory", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")

class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    restaurant = relationship("Restaurant", back_populates="categories")
    items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    category_id = Column(Integer, ForeignKey("menu_categories.id"))
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    category = relationship("MenuCategory", back_populates="items")

class User(Base):
    __tablename__ = "users"

    telegram_id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    items = Column(JSON, nullable=False)  # Array of {item_id, quantity, price}
    total_amount = Column(Float, nullable=False)
    delivery_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="orders")
    user = relationship("User", back_populates="orders")
    transactions = relationship("Transaction", back_populates="order")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    provider = Column(String, nullable=False) # payme, click, uzum, paynet
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    provider_transaction_id = Column(String, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="transactions")

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(BigInteger, ForeignKey("restaurant_owners.telegram_id"))
    amount = Column(Float, nullable=False)
    card_number = Column(String, nullable=False)
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("RestaurantOwner", back_populates="withdrawals")
