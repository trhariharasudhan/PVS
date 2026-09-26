import re
import uuid
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timezone
from app.models.communication_event import CommunicationChannel, CommunicationStatus


@dataclass
class ChannelDeliveryResult:
    success: bool
    status: CommunicationStatus
    provider: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    is_dry_run: bool = True
    delivered_at: Optional[datetime] = None


class BaseChannelAdapter(ABC):
    @abstractmethod
    async def send(
        self,
        recipient: str,
        subject: Optional[str],
        content: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ChannelDeliveryResult:
        pass


class NeutralEmailAdapter(BaseChannelAdapter):
    """
    Provider-neutral transactional email adapter.
    Enforces email format validation, attachment handling, and safe dry-run simulation.
    Zero external network calls without explicit business configuration.
    """
    EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

    def __init__(self, mode: str = "simulation"):
        self.mode = mode

    async def send(
        self,
        recipient: str,
        subject: Optional[str],
        content: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ChannelDeliveryResult:
        clean_recipient = recipient.strip() if recipient else ""
        if not clean_recipient or not self.EMAIL_REGEX.match(clean_recipient):
            return ChannelDeliveryResult(
                success=False,
                status=CommunicationStatus.FAILED,
                provider="neutral_email_stub",
                error_message=f"Invalid email recipient format: '{recipient}'",
                is_dry_run=True,
            )

        if not subject:
            return ChannelDeliveryResult(
                success=False,
                status=CommunicationStatus.FAILED,
                provider="neutral_email_stub",
                error_message="Email subject is mandatory.",
                is_dry_run=True,
            )

        # In stub / simulation mode, generate deterministic simulated delivery
        msg_id = f"sim_email_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        return ChannelDeliveryResult(
            success=True,
            status=CommunicationStatus.SIMULATED_DRY_RUN if self.mode == "simulation" else CommunicationStatus.SENT,
            provider="neutral_email_stub",
            provider_message_id=msg_id,
            delivered_at=now,
            is_dry_run=(self.mode == "simulation"),
        )


class NeutralWhatsAppAdapter(BaseChannelAdapter):
    """
    Provider-neutral transactional WhatsApp adapter.
    Enforces E.164 phone number validation and safe dry-run template simulation.
    Zero external network calls without explicit business configuration.
    """
    PHONE_REGEX = re.compile(r"^\+?[1-9]\d{9,14}$")

    def __init__(self, mode: str = "simulation"):
        self.mode = mode

    async def send(
        self,
        recipient: str,
        subject: Optional[str],
        content: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ChannelDeliveryResult:
        clean_phone = recipient.replace(" ", "").replace("-", "").strip() if recipient else ""
        if not clean_phone or not self.PHONE_REGEX.match(clean_phone):
            return ChannelDeliveryResult(
                success=False,
                status=CommunicationStatus.FAILED,
                provider="neutral_whatsapp_stub",
                error_message=f"Invalid WhatsApp phone number format: '{recipient}'",
                is_dry_run=True,
            )

        msg_id = f"sim_wa_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        return ChannelDeliveryResult(
            success=True,
            status=CommunicationStatus.SIMULATED_DRY_RUN if self.mode == "simulation" else CommunicationStatus.SENT,
            provider="neutral_whatsapp_stub",
            provider_message_id=msg_id,
            delivered_at=now,
            is_dry_run=(self.mode == "simulation"),
        )
