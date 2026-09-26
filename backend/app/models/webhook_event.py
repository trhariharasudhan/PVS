import enum
import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, Integer, JSON, DateTime, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel


class WebhookEventStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    DUPLICATE = "DUPLICATE"
    IGNORED = "IGNORED"
    FAILED = "FAILED"


class PaymentWebhookEvent(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    """
    Additive persistence model for payment gateway webhook events.
    Enforces idempotency and cryptographic auditability across payment providers.
    """
    __tablename__ = "payment_webhook_events"

    provider: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    event_id: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    status: Mapped[WebhookEventStatus] = mapped_column(
        SAEnum(WebhookEventStatus, name="webhook_event_status", native_enum=False),
        default=WebhookEventStatus.PENDING,
        index=True,
        nullable=False,
    )
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    signature_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event_id"),
    )

    def __repr__(self) -> str:
        return f"<PaymentWebhookEvent {self.provider}:{self.event_id} ({self.status.value})>"
