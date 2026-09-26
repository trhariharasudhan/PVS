import uuid
import pytest
from decimal import Decimal
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderType, OrderStatus, PaymentStatus
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.payment import Payment, PaymentType, PaymentMethod, PaymentRecordStatus
from app.models.communication_event import (
    CommunicationEvent,
    CommunicationChannel,
    CommunicationEventType,
    CommunicationStatus,
)
from app.services.communication_service import CommunicationDispatcherService
from app.core.communication_adapters import (
    NeutralEmailAdapter,
    NeutralWhatsAppAdapter,
    ChannelDeliveryResult,
)
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_order_and_invoice_communication_dispatch_lifecycle(db_session: AsyncSession):
    """
    1. Tests full transactional communication lifecycle for Order & Invoice events across Email and WhatsApp.
    2. Verifies dynamic PDF generation and attachment metadata.
    3. Verifies SIMULATED_DRY_RUN status without real external dispatch.
    """
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Kanchi Weavers Co-op",
        email="orders@kanchiweavers.example.com",
        phone="+919840112233",
        city="Kanchipuram",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
    )
    db_session.add(customer)
    await db_session.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=f"ORD-COMM-{uuid.uuid4().hex[:6]}",
        customer_id=customer.id,
        order_type=OrderType.WHOLESALE_BULK,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        subtotal_amount=Decimal("120000.00"),
        tax_amount=Decimal("6000.00"),
        total_amount=Decimal("126000.00"),
    )
    db_session.add(order)
    await db_session.flush()

    invoice = Invoice(
        id=uuid.uuid4(),
        invoice_number=f"INV-COMM-{uuid.uuid4().hex[:6]}",
        invoice_type=InvoiceType.TAX_INVOICE,
        order_id=order.id,
        customer_id=customer.id,
        invoice_date=date.today(),
        subtotal_amount=Decimal("120000.00"),
        cgst_amount=Decimal("3000.00"),
        sgst_amount=Decimal("3000.00"),
        total_tax_amount=Decimal("6000.00"),
        total_amount=Decimal("126000.00"),
        paid_amount=Decimal("0.00"),
        balance_due=Decimal("126000.00"),
        status=InvoiceStatus.ISSUED,
    )
    db_session.add(invoice)
    await db_session.commit()

    # 1. Dispatch Order Confirmation Notification
    order_events = await CommunicationDispatcherService.dispatch_order_notification(
        db=db_session,
        order_id=order.id,
        event_type=CommunicationEventType.ORDER_CONFIRMED,
        correlation_id="test-corr-order-01",
    )
    assert len(order_events) == 2
    email_evt = next(e for e in order_events if e.channel == CommunicationChannel.EMAIL)
    wa_evt = next(e for e in order_events if e.channel == CommunicationChannel.WHATSAPP)

    assert email_evt.status == CommunicationStatus.SIMULATED_DRY_RUN
    assert email_evt.recipient == "orders@kanchiweavers.example.com"
    assert "Order #" in email_evt.subject
    assert "₹126,000.00" in email_evt.rendered_content

    assert wa_evt.status == CommunicationStatus.SIMULATED_DRY_RUN
    assert wa_evt.recipient == "+919840112233"

    # 2. Dispatch Invoice Issued Notification with ReportLab PDF
    invoice_events = await CommunicationDispatcherService.dispatch_invoice_notification(
        db=db_session,
        invoice_id=invoice.id,
        event_type=CommunicationEventType.INVOICE_ISSUED,
        correlation_id="test-corr-inv-01",
    )
    assert len(invoice_events) == 2
    inv_email_evt = next(e for e in invoice_events if e.channel == CommunicationChannel.EMAIL)

    assert inv_email_evt.status == CommunicationStatus.SIMULATED_DRY_RUN
    assert inv_email_evt.attachments_metadata is not None
    attachments = inv_email_evt.attachments_metadata.get("attachments", [])
    assert len(attachments) == 1
    assert "Tax_Invoice_" in attachments[0]["filename"]
    assert attachments[0]["content_type"] == "application/pdf"
    assert attachments[0]["size_bytes"] > 1000  # Non-empty PDF generated


@pytest.mark.asyncio
async def test_communication_idempotency_prevents_duplicate_dispatch(db_session: AsyncSession):
    """
    Idempotency Test: Attempting to dispatch the exact same event multiple times returns existing event without re-dispatch.
    """
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Idempotency Test Merchant",
        email="merchant@idempotent.example.com",
        phone="+919840998877",
        city="Salem",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
    )
    db_session.add(customer)
    await db_session.flush()

    payment = Payment(
        id=uuid.uuid4(),
        payment_number=f"PAY-IDEM-{uuid.uuid4().hex[:6]}",
        payment_type=PaymentType.INBOUND_CUSTOMER_PAYMENT,
        customer_id=customer.id,
        amount=Decimal("50000.00"),
        payment_method=PaymentMethod.UPI,
        payment_status=PaymentRecordStatus.CLEARED,
        reference_transaction_id="UPI-TXN-123456",
        payment_date=date.today(),
    )
    db_session.add(payment)
    await db_session.commit()

    # First Dispatch
    events_1 = await CommunicationDispatcherService.dispatch_payment_notification(
        db=db_session,
        payment_id=payment.id,
        event_type=CommunicationEventType.PAYMENT_CONFIRMED,
    )
    assert len(events_1) == 2
    first_email_id = events_1[0].id

    # Second Dispatch (Identical event & recipient)
    events_2 = await CommunicationDispatcherService.dispatch_payment_notification(
        db=db_session,
        payment_id=payment.id,
        event_type=CommunicationEventType.PAYMENT_CONFIRMED,
    )
    assert len(events_2) == 2
    # Verify exact same event returned without duplicating database rows
    assert events_2[0].id == first_email_id


@pytest.mark.asyncio
async def test_invalid_recipient_and_retry_bounded_policy(db_session: AsyncSession):
    """
    Retry & Validation Test: Invalid recipient causes FAILED status; manual retry increments attempt count and stops at max_attempts.
    """
    event = CommunicationEvent(
        id=uuid.uuid4(),
        event_type=CommunicationEventType.ORDER_CREATED,
        channel=CommunicationChannel.EMAIL,
        provider="neutral_email_stub",
        recipient="invalid-email-no-at-sign",
        status=CommunicationStatus.FAILED,
        rendered_content="Test content",
        idempotency_key=f"FAIL_TEST:{uuid.uuid4()}",
        attempt_count=1,
        max_attempts=3,
        error_message="Invalid email recipient format",
    )
    db_session.add(event)
    await db_session.commit()

    # Retry Attempt 1 -> attempt_count becomes 2
    retried_1 = await CommunicationDispatcherService.retry_event(db=db_session, event_id=event.id)
    assert retried_1.attempt_count == 2
    assert retried_1.status == CommunicationStatus.FAILED

    # Retry Attempt 2 -> attempt_count becomes 3
    retried_2 = await CommunicationDispatcherService.retry_event(db=db_session, event_id=event.id)
    assert retried_2.attempt_count == 3
    assert retried_2.status == CommunicationStatus.FAILED

    # Retry Attempt 3 -> exceeds max_attempts, permanent failure
    retried_3 = await CommunicationDispatcherService.retry_event(db=db_session, event_id=event.id)
    assert retried_3.status == CommunicationStatus.FAILED
    assert "Permanent failure" in retried_3.error_message


@pytest.mark.asyncio
async def test_admin_communication_events_api(db_session: AsyncSession):
    """
    API & RBAC Test: Admin can query communication events log and trigger retries.
    """
    admin_user = User(
        id=uuid.uuid4(),
        email=f"admin_comm_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("AdminPass@123"),
        full_name="Admin Communications",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.commit()

    token = create_access_token(subject=str(admin_user.id), role=admin_user.role.value)

    with TestClient(app) as client:
        # 1. Query communication events listing
        resp = client.get("/api/v1/communications/events", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data

        # 2. Non-existent event retry -> 404
        bad_id = uuid.uuid4()
        retry_resp = client.post(f"/api/v1/communications/events/{bad_id}/retry", headers={"Authorization": f"Bearer {token}"})
        assert retry_resp.status_code == 404
