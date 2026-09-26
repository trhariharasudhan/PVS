from typing import Optional
from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Sender's full name")
    phone: str = Field(..., min_length=7, max_length=30, description="Phone or WhatsApp number")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    subject: str = Field("General Inquiry", max_length=255, description="Topic or saree code")
    message: str = Field(..., min_length=5, max_length=2000, description="Inquiry message content")


class ContactResponse(BaseModel):
    status: str = "received"
    message: str = "Thank you for reaching out. The PVS Silk S team will contact you shortly."
