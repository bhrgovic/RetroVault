from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

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

class GameOut(BaseModel):
    id: int
    title: str
    platform: str
    year: int
    genre: str

    model_config = ConfigDict(from_attributes=True)
