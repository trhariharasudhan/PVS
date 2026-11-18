import re
import uuid
from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

HEX_COLOUR = re.compile(r"^#[0-9a-fA-F]{6}$")

# Customer-facing labels for each status (shown on the public status page).
STATUS_LABELS = {
    "NEW": "Request received",
    "CONTACTED": "PVS has contacted you",
    "DESIGN_REVIEW": "Design under review",
    "QUOTED": "Quotation shared",
    "CONFIRMED": "Order confirmed",
    "IN_PRODUCTION": "On the loom",
    "READY": "Ready for dispatch",
    "DELIVERED": "Delivered",
    "CANCELLED": "Cancelled",
}


class CustomOrderCreate(BaseModel):
    """Saree specification submitted from the Custom Order Builder."""

    segment: Literal["INDIVIDUAL", "RETAILER", "WHOLESALE"]
    contact_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=7, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    business_name: Optional[str] = Field(None, max_length=255)
    preferred_contact: Literal["whatsapp", "call", "visit", "email"] = "whatsapp"

    saree_type: str = Field(..., min_length=2, max_length=100)
    occasion: Optional[str] = Field(None, max_length=100)
    body_colour: str
    border_colour: str
    pallu_colour: str
    silk_type: str = Field(..., min_length=2, max_length=100)
    silk_percentage: Optional[int] = Field(None, ge=0, le=100)
    zari_type: str = Field(..., min_length=2, max_length=100)
    border_style: Optional[str] = Field(None, max_length=100)
    design_notes: Optional[str] = Field(None, max_length=3000)

    quantity: int = Field(1, ge=1, le=10000)
    needed_by: Optional[date] = None
    budget_range: Optional[str] = Field(None, max_length=50)
    consent_to_contact: bool = True

    # Honeypot: real users never fill this hidden field.
    website: Optional[str] = Field(None, max_length=200)

    @field_validator("body_colour", "border_colour", "pallu_colour")
    @classmethod
    def _hex(cls, v: str) -> str:
        if not HEX_COLOUR.match(v):
            raise ValueError("Colour must be a hex value like #8E1426")
        return v.upper()

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Enter a valid phone number with at least 10 digits")
        return v.strip()

    @field_validator("needed_by")
    @classmethod
    def _future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("Needed-by date cannot be in the past")
        return v


class CustomOrderSubmitted(BaseModel):
    reference_code: str
    status: str
    message: str


class CustomOrderPublicStatus(BaseModel):
    reference_code: str
    status: str
    status_label: str
    saree_type: str
    quantity: int
    updated_at: datetime


class AttachmentInfo(BaseModel):
    index: int
    filename: str
    content_type: str
    size: int


class AdminCustomOrderList(BaseModel):
    id: uuid.UUID
    reference_code: str
    segment: str
    contact_name: str
    phone: str
    city: Optional[str]
    saree_type: str
    quantity: int
    needed_by: Optional[date]
    status: str
    attachment_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCustomOrderDetail(BaseModel):
    id: uuid.UUID
    reference_code: str
    segment: str
    contact_name: str
    phone: str
    email: Optional[str]
    city: Optional[str]
    business_name: Optional[str]
    preferred_contact: str
    saree_type: str
    occasion: Optional[str]
    body_colour: str
    border_colour: str
    pallu_colour: str
    silk_type: str
    silk_percentage: Optional[int]
    zari_type: str
    border_style: Optional[str]
    design_notes: Optional[str]
    quantity: int
    needed_by: Optional[date]
    budget_range: Optional[str]
    attachments: List[AttachmentInfo]
    status: str
    internal_notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class AdminCustomOrderUpdate(BaseModel):
    status: Optional[Literal[tuple(STATUS_LABELS.keys())]] = None  # type: ignore[valid-type]
    internal_notes: Optional[str] = Field(None, max_length=5000)
