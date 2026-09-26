import enum
import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, JSON, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel


class CommunicationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"
    SMS = "SMS"


class CommunicationEventType(str, enum.Enum):
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    ORDER_DISPATCHED = "ORDER_DISPATCHED"
    ORDER_DELIVERED = "ORDER_DELIVERED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    INVOICE_ISSUED = "INVOICE_ISSUED"
    INVOICE_PAID = "INVOICE_PAID"
    DEALER_ACCOUNT_CREATED = "DEALER_ACCOUNT_CREATED"
    DEALER_ACCOUNT_APPROVED = "DEALER_ACCOUNT_APPROVED"


class CommunicationStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    SIMULATED_DRY_RUN = "SIMULATED_DRY_RUN"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"


class CommunicationEvent(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    """
    Transactional Communication Event Persistence.
    Enforces idempotency, auditability, delivery status tracking,
    and provider-neutral channel execution.
    """
    __tablename__ = "communication_events"

    event_type: Mapped[CommunicationEventType] = mapped_column(
        SAEnum(CommunicationEventType, name="communication_event_type", native_enum=False),
        index=True,
        nullable=False,
    )
    channel: Mapped[CommunicationChannel] = mapped_column(
        SAEnum(CommunicationChannel, name="communication_channel", native_enum=False),
        index=True,
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), default="neutral_stub", index=True, nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    status: Mapped[CommunicationStatus] = mapped_column(
        SAEnum(CommunicationStatus, name="communication_status", native_enum=False),
        default=CommunicationStatus.QUEUED,
        index=True,
        nullable=False,
    )

    # Domain Entity References
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Content & Idempotency
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rendered_content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Delivery & Retries
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<CommunicationEvent {self.event_type.value}:{self.channel.value} to {self.recipient} ({self.status.value})>"
