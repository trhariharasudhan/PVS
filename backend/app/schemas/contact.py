import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
import re


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Sender's full name")
    phone: str = Field(..., min_length=7, max_length=30, description="Phone or WhatsApp number")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    subject: str = Field("General Inquiry", max_length=255, description="Topic")
    message: str = Field(..., min_length=5, max_length=2000, description="Inquiry message content")
    language: Optional[Literal["en", "ta"]] = Field(None, description="Site language the visitor used")
    # Honeypot: real users never fill this hidden field.
    website: Optional[str] = Field(None, max_length=200)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Enter a valid phone number with at least 10 digits")
        return v.strip()


class ContactResponse(BaseModel):
    status: str = "received"
    message: str = "Thank you for reaching out. The PVS team will contact you shortly."


class AdminContactMessage(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: Optional[str]
    subject: str
    message: str
    language: Optional[str]
    status: str
    internal_notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminContactMessageUpdate(BaseModel):
    status: Optional[Literal["NEW", "REPLIED", "CLOSED"]] = None
    internal_notes: Optional[str] = Field(None, max_length=5000)
