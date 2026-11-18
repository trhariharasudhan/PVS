import enum
from datetime import date
from typing import Optional

from sqlalchemy import JSON, Boolean, Date, Integer, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimeStampedModel, UUIDPrimaryKeyMixin


class CustomOrderStatus(str, enum.Enum):
    """Lifecycle of a made-to-order saree request (PVS has no ready stock)."""

    NEW = "NEW"
    CONTACTED = "CONTACTED"
    DESIGN_REVIEW = "DESIGN_REVIEW"
    QUOTED = "QUOTED"
    CONFIRMED = "CONFIRMED"
    IN_PRODUCTION = "IN_PRODUCTION"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class CustomerSegment(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"  # family / bridal / personal order (retail)
    RETAILER = "RETAILER"  # boutique or saree shop
    WHOLESALE = "WHOLESALE"  # bulk / distributor


class CustomOrderRequest(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    """
    A customer's request to have a saree woven to their specification.
    Stores the full spec (colours, silk, zari, quantity) plus uploaded design references.
    """

    __tablename__ = "custom_order_requests"

    reference_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    segment: Mapped[CustomerSegment] = mapped_column(
        SAEnum(CustomerSegment, name="customer_segment", native_enum=False), nullable=False, index=True
    )

    # Contact
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    preferred_contact: Mapped[str] = mapped_column(String(20), nullable=False, default="whatsapp")

    # Saree specification
    saree_type: Mapped[str] = mapped_column(String(100), nullable=False)
    occasion: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    body_colour: Mapped[str] = mapped_column(String(7), nullable=False)
    border_colour: Mapped[str] = mapped_column(String(7), nullable=False)
    pallu_colour: Mapped[str] = mapped_column(String(7), nullable=False)
    silk_type: Mapped[str] = mapped_column(String(100), nullable=False)
    silk_percentage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    zari_type: Mapped[str] = mapped_column(String(100), nullable=False)
    border_style: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    design_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # {"border_style": "temple", "border_motif": "peacock", "body_pattern": "buttas", ...}
    design_options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Order
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    needed_by: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    budget_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # [{ "key": str, "filename": str, "content_type": str, "size": int }]
    attachments: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    consent_to_contact: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    status: Mapped[CustomOrderStatus] = mapped_column(
        SAEnum(CustomOrderStatus, name="custom_order_status", native_enum=False),
        default=CustomOrderStatus.NEW,
        index=True,
        nullable=False,
    )
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<CustomOrderRequest {self.reference_code} ({self.status})>"
