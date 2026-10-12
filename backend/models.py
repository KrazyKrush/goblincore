from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = relationship("Note", back_populates="owner")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Без названия")
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="notes")
    # 👇 Каскадное удаление транзакций
    transactions = relationship(
        "Transaction",
        back_populates="note",
        cascade="all, delete-orphan",
    )

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    is_income = Column(Boolean, default=False) # True = доход, False = расход
    amount = Column(Float, nullable=False)
    organization = Column(String, nullable=False)
    note_id = Column(Integer, ForeignKey("notes.id"))
    note = relationship("Note", back_populates="transactions")