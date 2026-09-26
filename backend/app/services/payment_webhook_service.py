import os
import json
import uuid
from decimal import Decimal
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone, date
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook_event import PaymentWebhookEvent, WebhookEventStatus
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType
from app.models.payment import Payment, PaymentType, PaymentMethod, PaymentRecordStatus
from app.models.order import Order, PaymentStatus
from app.core.webhook_security import verify_webhook_hmac_signature, WebhookSignatureVerificationError
from app.core.audit import log_audit_event


class PaymentWebhookService:
    """
    Provider-neutral payment gateway webhook ingestion and auto-reconciliation service.
    Enforces idempotency, HMAC verification, amount consistency, and transactional settlement.
    """

    SUPPORTED_GATEWAYS = {"generic", "razorpay", "cashfree", "sbi_epay"}

    @classmethod
    def get_gateway_secret(cls, gateway: str) -> Optional[str]:
        """
        Retrieve webhook signing secret from environment configuration.
        Never hard-codes secrets or exposes them.
        """
        env_var = f"WEBHOOK_SECRET_{gateway.upper()}"
        secret = os.getenv(env_var)
        if not secret and gateway == "generic":
            secret = os.getenv("PAYMENT_WEBHOOK_SECRET")
        return secret

    @classmethod
    async def process_incoming_webhook(
        cls,
        db: AsyncSession,
        gateway: str,
        raw_body: bytes,
        signature_header: Optional[str],
    ) -> Dict[str, Any]:
        """
        Ingest, verify, persist, and reconcile incoming payment gateway webhook.
        """
        clean_gateway = gateway.lower().strip()
        if clean_gateway not in cls.SUPPORTED_GATEWAYS:
            raise ValueError(f"Unsupported payment gateway provider '{gateway}'.")

        # 1. Signature Verification
        secret = cls.get_gateway_secret(clean_gateway)
        if not secret:
            raise ValueError(f"Webhook secret not configured for gateway '{clean_gateway}'.")

        if not signature_header or not verify_webhook_hmac_signature(raw_body, signature_header, secret):
            raise WebhookSignatureVerificationError("Invalid or missing webhook cryptographic signature.")

        # 2. Parse Payload
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            raise ValueError(f"Invalid JSON payload: {str(e)}")

        # 3. Extract Canonical Event Attributes
        event_id, event_type = cls._extract_event_identifiers(clean_gateway, payload)
        if not event_id:
            raise ValueError("Webhook payload does not contain a valid external event ID.")

        # 4. Idempotency Check & Event Persistence
        # Check if event already received
        stmt = select(PaymentWebhookEvent).where(
            and_(
                PaymentWebhookEvent.provider == clean_gateway,
                PaymentWebhookEvent.event_id == event_id,
            )
        )
        existing_event = (await db.execute(stmt)).scalars().first()

        if existing_event:
            # Duplicate webhook delivery: return idempotent success
            log_audit_event(
                event_type="PAYMENT_WEBHOOK",
                action="DUPLICATE_WEBHOOK_RECEIVED",
                status="IGNORED",
                resource_id=str(existing_event.id),
                details={"provider": clean_gateway, "event_id": event_id, "status": existing_event.status.value},
            )
            return {
                "status": "duplicate",
                "message": f"Event '{event_id}' already processed.",
                "event_id": event_id,
                "event_status": existing_event.status.value,
            }

        # Persist new webhook event
        webhook_event = PaymentWebhookEvent(
            id=uuid.uuid4(),
            provider=clean_gateway,
            event_id=event_id,
            event_type=event_type,
            status=WebhookEventStatus.PENDING,
            payload=payload,
            signature_verified=True,
            retry_count=0,
        )
        db.add(webhook_event)
        await db.flush()

        # 5. Reconcile Business Payment
        reconciliation_result = await cls.reconcile_event(db, webhook_event)
        await db.commit()

        return reconciliation_result

    @classmethod
    def _extract_event_identifiers(cls, gateway: str, payload: Dict[str, Any]) -> Tuple[str, str]:
        """Extract provider-specific event ID and event type into standard tuple."""
        if gateway == "razorpay":
            event_id = payload.get("event_id") or payload.get("id") or str(uuid.uuid4())
            event_type = payload.get("event") or "payment.captured"
            return str(event_id), str(event_type)
        elif gateway == "cashfree":
            event_id = payload.get("event_id") or payload.get("data", {}).get("order", {}).get("order_id") or str(uuid.uuid4())
            event_type = payload.get("type") or "PAYMENT_SUCCESS_WEBHOOK"
            return str(event_id), str(event_type)
        else:
            # Generic / Neutral Provider Format
            event_id = payload.get("event_id") or payload.get("id") or payload.get("transaction_id")
            event_type = payload.get("event_type") or payload.get("event") or "payment.captured"
            return str(event_id) if event_id else "", str(event_type)

    @classmethod
    async def reconcile_event(
        cls,
        db: AsyncSession,
        event: PaymentWebhookEvent,
    ) -> Dict[str, Any]:
        """
        Reconcile payment event with authoritative invoice/order records.
        """
        payload = event.payload
        event_type = event.event_type.lower()

        # Supported payment settlement event patterns
        success_events = {"payment.captured", "payment.success", "payment_success_webhook", "order.paid", "charge.succeeded"}
        failure_events = {"payment.failed", "payment_failed_webhook", "charge.failed"}

        if event_type in failure_events:
            event.status = WebhookEventStatus.PROCESSED
            event.processed_at = datetime.now(timezone.utc)
            event.error_message = "Payment failed at gateway."
            return {"status": "success", "action": "recorded_failure", "event_id": event.event_id}

        if event_type not in success_events:
            event.status = WebhookEventStatus.IGNORED
            event.processed_at = datetime.now(timezone.utc)
            event.error_message = f"Unsupported event type '{event.event_type}'."
            return {"status": "ignored", "message": f"Event type '{event.event_type}' ignored.", "event_id": event.event_id}

        # Extract payment data
        payment_data = payload.get("data", {}).get("payment", {}) or payload.get("payment", {}) or payload
        raw_amount = payment_data.get("amount")
        currency = (payment_data.get("currency") or "INR").upper()
        reference_tx_id = payment_data.get("transaction_id") or payment_data.get("id") or event.event_id

        # Extract notes or metadata mapping
        notes_dict = payment_data.get("notes") or payload.get("notes") or {}
        invoice_ref = notes_dict.get("invoice_id") or notes_dict.get("invoice_number") or payload.get("invoice_number") or payload.get("invoice_id")

        if not raw_amount:
            event.status = WebhookEventStatus.FAILED
            event.error_message = "Missing payment amount in webhook payload."
            return {"status": "failed", "error": "Missing amount", "event_id": event.event_id}

        # Convert amount (if passed in paise/cents e.g. 500000 -> 5000.00 INR)
        # Note: If amount is >= 1000 and is integer, check if passed in paise/minor units
        amount = Decimal(str(raw_amount))
        if payment_data.get("amount_in_paise") is True:
            amount = amount / Decimal("100")

        if currency != "INR":
            event.status = WebhookEventStatus.FAILED
            event.error_message = f"Currency mismatch: expected INR, received {currency}."
            return {"status": "failed", "error": "Currency mismatch", "event_id": event.event_id}

        # Locate Authoritative Invoice
        invoice: Optional[Invoice] = None
        if invoice_ref:
            try:
                inv_uuid = uuid.UUID(str(invoice_ref))
                inv_q = select(Invoice).where(Invoice.id == inv_uuid).with_for_update(of=Invoice)
                invoice = (await db.execute(inv_q)).scalars().first()
            except ValueError:
                inv_q = select(Invoice).where(Invoice.invoice_number == str(invoice_ref)).with_for_update(of=Invoice)
                invoice = (await db.execute(inv_q)).scalars().first()

        if not invoice:
            event.status = WebhookEventStatus.FAILED
            event.error_message = f"Invoice not found for reference '{invoice_ref}'."
            return {"status": "failed", "error": f"Invoice '{invoice_ref}' not found", "event_id": event.event_id}

        if invoice.status in [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]:
            event.status = WebhookEventStatus.IGNORED
            event.processed_at = datetime.now(timezone.utc)
            event.error_message = f"Invoice is already {invoice.status.value}."
            return {"status": "ignored", "message": f"Invoice already {invoice.status.value}", "event_id": event.event_id}

        # Validate Overpayment
        if amount > invoice.balance_due:
            event.status = WebhookEventStatus.FAILED
            event.error_message = f"Overpayment error: payment amount ({amount}) exceeds balance due ({invoice.balance_due})."
            return {"status": "failed", "error": "Overpayment rejected", "event_id": event.event_id}

        # Create Cleared Payment Record
        today_str = date.today().strftime("%Y%m%d")
        pay_count_q = select(func.count(Payment.id)).where(Payment.payment_number.like(f"PAY-GW-{today_str}-%"))
        today_pay_count = (await db.execute(pay_count_q)).scalar() or 0
        payment_num = f"PAY-GW-{today_str}-{(today_pay_count + 1):04d}"

        payment = Payment(
            id=uuid.uuid4(),
            payment_number=payment_num,
            payment_type=PaymentType.INBOUND_CUSTOMER_PAYMENT,
            customer_id=invoice.customer_id,
            order_id=invoice.order_id,
            invoice_id=invoice.id,
            amount=amount,
            payment_method=PaymentMethod.UPI if "upi" in str(payment_data.get("method", "")).lower() else PaymentMethod.BANK_TRANSFER_NEFT_RTGS,
            payment_status=PaymentRecordStatus.CLEARED,
            reference_transaction_id=str(reference_tx_id),
            payment_date=date.today(),
            notes=f"Auto-cleared via {event.provider.upper()} Webhook {event.event_id}",
        )
        db.add(payment)

        # Update Invoice Settlement State
        invoice.paid_amount += amount
        invoice.balance_due -= amount
        if invoice.balance_due == Decimal("0.00"):
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID

        # If linked to an Order, check order payment status
        if invoice.order_id and invoice.status == InvoiceStatus.PAID:
            ord_q = select(Order).where(Order.id == invoice.order_id).with_for_update(of=Order)
            order = (await db.execute(ord_q)).scalars().first()
            if order:
                order.payment_status = PaymentStatus.FULLY_PAID

        # Mark Webhook Event as Processed
        event.status = WebhookEventStatus.PROCESSED
        event.processed_at = datetime.now(timezone.utc)
        event.error_message = None

        # Emit Audit Log
        log_audit_event(
            event_type="PAYMENT_RECONCILIATION",
            action="PAYMENT_CLEARED_VIA_WEBHOOK",
            status="SUCCESS",
            resource_id=str(payment.id),
            details={
                "provider": event.provider,
                "event_id": event.event_id,
                "invoice_id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "amount": float(amount),
                "remaining_balance": float(invoice.balance_due),
                "invoice_status": invoice.status.value,
            },
        )

        return {
            "status": "success",
            "action": "reconciled",
            "payment_id": str(payment.id),
            "payment_number": payment.payment_number,
            "invoice_number": invoice.invoice_number,
            "amount": float(amount),
            "invoice_status": invoice.status.value,
        }
