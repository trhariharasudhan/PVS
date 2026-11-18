import enum
from typing import Optional

from sqlalchemy import Enum as SAEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimeStampedModel, UUIDPrimaryKeyMixin


class ContactMessageStatus(str, enum.Enum):
    NEW = "NEW"
    REPLIED = "REPLIED"
    CLOSED = "CLOSED"


class ContactMessage(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    """A message sent from the public Contact page. Stored so nothing is lost."""

    __tablename__ = "contact_messages"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False, default="General Inquiry")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    status: Mapped[ContactMessageStatus] = mapped_column(
        SAEnum(ContactMessageStatus, name="contact_message_status", native_enum=False),
        default=ContactMessageStatus.NEW,
        index=True,
        nullable=False,
    )
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<ContactMessage from {self.name} ({self.status})>"
