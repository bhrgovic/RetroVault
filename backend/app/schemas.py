from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime 
from typing import List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str


class GameCreate(BaseModel):
    title: str
    platform: str
    year: int
    genre: str

class GameUpdate(BaseModel):
    title:str
    platform: str
    year: int
    genre: str

class SaveOut(BaseModel):
    id: int
    file_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GameOut(BaseModel):
    id: int
    title: str
    platform: str
    year: int
    genre: str
    rom_path: Optional[str] = None
    art_path: Optional[str] = None
    saves: List[SaveOut] = []

    model_config = ConfigDict(from_attributes=True)
