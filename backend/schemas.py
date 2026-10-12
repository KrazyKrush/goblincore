from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TransactionBase(BaseModel):
    is_income: bool
    amount: float
    organization: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: Optional[str] = "Без названия"
    content: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    created_at: datetime
    transactions: List[TransactionResponse] = []
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None