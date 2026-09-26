import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.user import User


class EnquiryStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CATALOGUE_SENT = "CATALOGUE_SENT"
    NEGOTIATING = "NEGOTIATING"
    CONVERTED_TO_ORDER = "CONVERTED_TO_ORDER"
    REJECTED = "REJECTED"


class WholesaleEnquiry(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "wholesale_enquiries"

    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    number_of_stores: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interested_collection: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expected_quantity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[EnquiryStatus] = mapped_column(
        SAEnum(EnquiryStatus, name="enquiry_status", native_enum=False),
        default=EnquiryStatus.NEW,
        index=True,
        nullable=False,
    )
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    assigned_user: Mapped[Optional["User"]] = relationship("User", back_populates="assigned_enquiries")

    def __repr__(self) -> str:
        return f"<WholesaleEnquiry from {self.business_name} ({self.status})>"
