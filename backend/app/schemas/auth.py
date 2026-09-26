import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.models.user import UserRole


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str = Field(..., description="Staff email address")
    password: str = Field(..., min_length=1, description="Account password")


class AuthResponse(BaseModel):
    user: UserPublic
    message: str = "Authenticated successfully"


class MessageResponse(BaseModel):
    message: str
