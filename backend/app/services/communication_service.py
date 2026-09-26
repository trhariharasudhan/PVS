import uuid
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication_event import (
    CommunicationEvent,
    CommunicationChannel,
    CommunicationEventType,
    CommunicationStatus,
)
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice, InvoiceItem
from app.models.payment import Payment
from app.models.customer import Customer
from app.models.user import User
from app.core.communication_adapters import (
    NeutralEmailAdapter,
    NeutralWhatsAppAdapter,
    BaseChannelAdapter,
)
from app.core.audit import log_audit_event
from app.utils.pdf_generator import generate_invoice_pdf


class CommunicationDispatcherService:
    """
    Central Transactional Communication Dispatcher and Outbox Service.
    Enforces server-authoritative rendering, database-level idempotency,
    bounded retries, and clean separation between dry-run and live delivery.
    """

    email_adapter: BaseChannelAdapter = NeutralEmailAdapter(mode="simulation")
    whatsapp_adapter: BaseChannelAdapter = NeutralWhatsAppAdapter(mode="simulation")

    @classmethod
    async def dispatch_order_notification(
        cls,
        db: AsyncSession,
        order_id: uuid.UUID,
        event_type: CommunicationEventType,
        correlation_id: Optional[str] = None,
    ) -> List[CommunicationEvent]:
        """
        Dispatch transactional communications for Order lifecycle events.
        """
        stmt = select(Order).where(Order.id == order_id)
        order = (await db.execute(stmt)).scalars().first()
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        customer = None
        if order.customer_id:
            c_stmt = select(Customer).where(Customer.id == order.customer_id)
            customer = (await db.execute(c_stmt)).scalars().first()

        recipient_email = customer.email if customer and customer.email else f"customer_{order.id.hex[:6]}@example.com"
        recipient_phone = customer.phone if customer and customer.phone else "+919840000000"

        subject = f"PVS Silk S — Order #{order.order_number} {event_type.value.replace('ORDER_', '')}"
        content = (
            f"Dear {customer.full_name if customer else 'Valued Customer'},\n\n"
            f"Your order #{order.order_number} status is now {order.order_status.value}.\n"
            f"Total Amount: ₹{order.total_amount:,.2f} (Inclusive of Handloom GST ₹{order.tax_amount:,.2f})\n"
            f"Payment Status: {order.payment_status.value}\n\n"
            f"Thank you for choosing PVS Silk S Kanchipuram Pure Silk Handlooms."
        )

        events = []
        # 1. Email Channel
        email_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.EMAIL,
            adapter=cls.email_adapter,
            recipient=recipient_email,
            subject=subject,
            content=content,
            order_id=order.id,
            customer_id=order.customer_id,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:EMAIL:{order.id}:{recipient_email}",
        )
        if email_evt:
            events.append(email_evt)

        # 2. WhatsApp Channel
        wa_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.WHATSAPP,
            adapter=cls.whatsapp_adapter,
            recipient=recipient_phone,
            subject=None,
            content=content,
            order_id=order.id,
            customer_id=order.customer_id,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:WHATSAPP:{order.id}:{recipient_phone}",
        )
        if wa_evt:
            events.append(wa_evt)

        return events

    @classmethod
    async def dispatch_invoice_notification(
        cls,
        db: AsyncSession,
        invoice_id: uuid.UUID,
        event_type: CommunicationEventType,
        correlation_id: Optional[str] = None,
    ) -> List[CommunicationEvent]:
        """
        Dispatch transactional communications for Tax Invoice events with dynamic PDF generation.
        """
        stmt = select(Invoice).where(Invoice.id == invoice_id)
        invoice = (await db.execute(stmt)).scalars().first()
        if not invoice:
            raise ValueError(f"Invoice '{invoice_id}' not found.")

        customer = None
        if invoice.customer_id:
            c_stmt = select(Customer).where(Customer.id == invoice.customer_id)
            customer = (await db.execute(c_stmt)).scalars().first()

        recipient_email = customer.email if customer and customer.email else f"billing_{invoice.id.hex[:6]}@example.com"
        recipient_phone = customer.phone if customer and customer.phone else "+919840000000"

        # Generate in-memory GST Tax Invoice PDF using ReportLab
        invoice_pdf_data = {
            "invoice_number": invoice.invoice_number,
            "invoice_type": invoice.invoice_type.value,
            "invoice_date": invoice.invoice_date.isoformat(),
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "customer_name": customer.full_name if customer else "Direct Customer",
            "customer_phone": customer.phone if customer else "",
            "customer_city": customer.city if customer else "Kanchipuram",
            "subtotal": str(invoice.subtotal_amount),
            "cgst": str(invoice.cgst_amount),
            "sgst": str(invoice.sgst_amount),
            "total_tax": str(invoice.total_tax_amount),
            "total_amount": str(invoice.total_amount),
            "balance_due": str(invoice.balance_due),
            "items": [],
        }
        pdf_bytes = generate_invoice_pdf(invoice_pdf_data)

        subject = f"PVS Silk S — Tax Invoice #{invoice.invoice_number}"
        content = (
            f"Dear {customer.full_name if customer else 'Valued Customer'},\n\n"
            f"Your Tax Invoice #{invoice.invoice_number} has been generated.\n"
            f"Total Invoice Value: ₹{invoice.total_amount:,.2f}\n"
            f"Balance Due: ₹{invoice.balance_due:,.2f}\n"
            f"Status: {invoice.status.value}\n\n"
            f"Please find your official GST Tax Invoice attached in PDF format."
        )

        attachments = [
            {
                "filename": f"Tax_Invoice_{invoice.invoice_number}.pdf",
                "content_type": "application/pdf",
                "size_bytes": len(pdf_bytes),
            }
        ]

        events = []
        # Email with PDF attachment
        email_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.EMAIL,
            adapter=cls.email_adapter,
            recipient=recipient_email,
            subject=subject,
            content=content,
            invoice_id=invoice.id,
            customer_id=invoice.customer_id,
            attachments=attachments,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:EMAIL:{invoice.id}:{recipient_email}",
        )
        if email_evt:
            events.append(email_evt)

        # WhatsApp text notification
        wa_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.WHATSAPP,
            adapter=cls.whatsapp_adapter,
            recipient=recipient_phone,
            subject=None,
            content=content,
            invoice_id=invoice.id,
            customer_id=invoice.customer_id,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:WHATSAPP:{invoice.id}:{recipient_phone}",
        )
        if wa_evt:
            events.append(wa_evt)

        return events

    @classmethod
    async def dispatch_payment_notification(
        cls,
        db: AsyncSession,
        payment_id: uuid.UUID,
        event_type: CommunicationEventType,
        correlation_id: Optional[str] = None,
    ) -> List[CommunicationEvent]:
        """
        Dispatch transactional communications for Payment receipt events.
        """
        stmt = select(Payment).where(Payment.id == payment_id)
        payment = (await db.execute(stmt)).scalars().first()
        if not payment:
            raise ValueError(f"Payment '{payment_id}' not found.")

        customer = None
        if payment.customer_id:
            c_stmt = select(Customer).where(Customer.id == payment.customer_id)
            customer = (await db.execute(c_stmt)).scalars().first()

        recipient_email = customer.email if customer and customer.email else f"customer_{payment.id.hex[:6]}@example.com"
        recipient_phone = customer.phone if customer and customer.phone else "+919840000000"

        subject = f"PVS Silk S — Payment Receipt #{payment.payment_number}"
        content = (
            f"Dear {customer.full_name if customer else 'Valued Customer'},\n\n"
            f"We have received and cleared your payment of ₹{payment.amount:,.2f}.\n"
            f"Receipt Reference: {payment.payment_number}\n"
            f"Transaction ID: {payment.reference_transaction_id or 'N/A'}\n"
            f"Payment Method: {payment.payment_method.value}\n\n"
            f"Thank you for your business with PVS Silk S."
        )

        events = []
        email_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.EMAIL,
            adapter=cls.email_adapter,
            recipient=recipient_email,
            subject=subject,
            content=content,
            customer_id=payment.customer_id,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:EMAIL:{payment.id}:{recipient_email}",
        )
        if email_evt:
            events.append(email_evt)

        wa_evt = await cls._dispatch_channel_event(
            db=db,
            event_type=event_type,
            channel=CommunicationChannel.WHATSAPP,
            adapter=cls.whatsapp_adapter,
            recipient=recipient_phone,
            subject=None,
            content=content,
            customer_id=payment.customer_id,
            correlation_id=correlation_id,
            idempotency_key=f"{event_type.value}:WHATSAPP:{payment.id}:{recipient_phone}",
        )
        if wa_evt:
            events.append(wa_evt)

        return events

    @classmethod
    async def _dispatch_channel_event(
        cls,
        db: AsyncSession,
        event_type: CommunicationEventType,
        channel: CommunicationChannel,
        adapter: BaseChannelAdapter,
        recipient: str,
        subject: Optional[str],
        content: str,
        order_id: Optional[uuid.UUID] = None,
        invoice_id: Optional[uuid.UUID] = None,
        customer_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        correlation_id: Optional[str] = None,
        idempotency_key: str = "",
    ) -> Optional[CommunicationEvent]:
        """
        Internal channel execution with database uniqueness and bounded retries.
        """
        # Check idempotency
        stmt = select(CommunicationEvent).where(CommunicationEvent.idempotency_key == idempotency_key)
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            # Idempotent return: do not re-send
            return existing

        # Execute channel adapter
        result = await adapter.send(
            recipient=recipient,
            subject=subject,
            content=content,
            attachments=attachments,
        )

        event = CommunicationEvent(
            id=uuid.uuid4(),
            event_type=event_type,
            channel=channel,
            provider=result.provider,
            recipient=recipient,
            status=result.status,
            order_id=order_id,
            invoice_id=invoice_id,
            customer_id=customer_id,
            user_id=user_id,
            subject=subject,
            rendered_content=content,
            attachments_metadata={"attachments": attachments} if attachments else None,
            idempotency_key=idempotency_key,
            attempt_count=1,
            max_attempts=3,
            sent_at=datetime.now(timezone.utc) if result.success else None,
            delivered_at=result.delivered_at,
            error_message=result.error_message,
            provider_message_id=result.provider_message_id,
            correlation_id=correlation_id,
        )
        db.add(event)
        await db.flush()

        log_audit_event(
            event_type="TRANSACTIONAL_COMMUNICATION",
            action=f"{channel.value}_DISPATCH",
            status="SUCCESS" if result.success else "FAILED",
            resource_id=str(event.id),
            details={
                "event_type": event_type.value,
                "channel": channel.value,
                "recipient": recipient,
                "status": result.status.value,
                "is_dry_run": result.is_dry_run,
            },
        )

        return event

    @classmethod
    async def retry_event(cls, db: AsyncSession, event_id: uuid.UUID) -> CommunicationEvent:
        """
        Retry a previously failed communication event with strict bounded attempts.
        """
        stmt = select(CommunicationEvent).where(CommunicationEvent.id == event_id)
        event = (await db.execute(stmt)).scalars().first()
        if not event:
            raise ValueError(f"Communication event '{event_id}' not found.")

        if event.status in [CommunicationStatus.SENT, CommunicationStatus.DELIVERED, CommunicationStatus.SIMULATED_DRY_RUN]:
            return event

        if event.attempt_count >= event.max_attempts:
            event.status = CommunicationStatus.FAILED
            event.error_message = f"Permanent failure: maximum retry attempts ({event.max_attempts}) exceeded."
            await db.commit()
            return event

        # Select adapter
        adapter = cls.email_adapter if event.channel == CommunicationChannel.EMAIL else cls.whatsapp_adapter
        event.attempt_count += 1

        result = await adapter.send(
            recipient=event.recipient,
            subject=event.subject,
            content=event.rendered_content,
            attachments=event.attachments_metadata.get("attachments") if event.attachments_metadata else None,
        )

        event.status = result.status
        event.error_message = result.error_message
        if result.success:
            event.sent_at = datetime.now(timezone.utc)
            event.delivered_at = result.delivered_at
            event.provider_message_id = result.provider_message_id

        await db.commit()
        return event
