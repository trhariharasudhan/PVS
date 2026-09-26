import os
import hmac
import hashlib
import json
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
from app.models.payment import Payment, PaymentRecordStatus
from app.models.webhook_event import PaymentWebhookEvent, WebhookEventStatus
from app.core.security import get_password_hash, create_access_token


TEST_WEBHOOK_SECRET = "test_super_secret_webhook_signing_key_12345"


@pytest.fixture(autouse=True)
def setup_webhook_secret(monkeypatch):
    """Set test webhook secret in environment for generic and razorpay gateways."""
    monkeypatch.setenv("WEBHOOK_SECRET_GENERIC", TEST_WEBHOOK_SECRET)
    monkeypatch.setenv("WEBHOOK_SECRET_RAZORPAY", TEST_WEBHOOK_SECRET)
    monkeypatch.setenv("PAYMENT_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET)


def generate_hmac_signature(payload_bytes: bytes, secret: str = TEST_WEBHOOK_SECRET) -> str:
    """Generate SHA256 HMAC signature for test payload."""
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_valid_webhook_ingestion_and_reconciliation_lifecycle(db_session: AsyncSession):
    """
    E2E Test: Valid HMAC signature -> Persist event -> Auto-reconcile payment and invoice.
    """
    # 1. Setup Customer, Order, and Invoice
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Venkatesh Silks Wholesale",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919840887766",
        city="Kanchipuram",
    )
    db_session.add(customer)
    await db_session.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=f"ORD-TEST-{uuid.uuid4().hex[:6]}",
        customer_id=customer.id,
        order_type=OrderType.WHOLESALE_BULK,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        subtotal_amount=Decimal("100000.00"),
        tax_amount=Decimal("5000.00"),
        total_amount=Decimal("105000.00"),
    )
    db_session.add(order)
    await db_session.flush()

    invoice = Invoice(
        id=uuid.uuid4(),
        invoice_number=f"INV-TEST-{uuid.uuid4().hex[:6]}",
        invoice_type=InvoiceType.TAX_INVOICE,
        order_id=order.id,
        customer_id=customer.id,
        invoice_date=date.today(),
        due_date=date.today(),
        subtotal_amount=Decimal("100000.00"),
        cgst_amount=Decimal("2500.00"),
        sgst_amount=Decimal("2500.00"),
        total_tax_amount=Decimal("5000.00"),
        total_amount=Decimal("105000.00"),
        paid_amount=Decimal("0.00"),
        balance_due=Decimal("105000.00"),
        status=InvoiceStatus.ISSUED,
    )
    db_session.add(invoice)
    await db_session.commit()

    # 2. Construct Webhook Payload
    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    payload_dict = {
        "event_id": event_id,
        "event_type": "payment.captured",
        "payment": {
            "id": f"pay_{uuid.uuid4().hex[:10]}",
            "amount": 105000.00,
            "currency": "INR",
            "method": "UPI",
            "notes": {
                "invoice_id": str(invoice.id),
                "order_id": str(order.id),
            },
        },
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    signature = generate_hmac_signature(payload_bytes)

    with TestClient(app) as client:
        # 3. Post Webhook
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
        }
        resp = client.post("/api/v1/webhooks/payments/generic", data=payload_bytes, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["action"] == "reconciled"
        assert data["invoice_number"] == invoice.invoice_number
        assert data["amount"] == 105000.00
        assert data["invoice_status"] == "PAID"

        # 4. Verify DB Settlement State
        await db_session.refresh(invoice)
        assert invoice.paid_amount == Decimal("105000.00")
        assert invoice.balance_due == Decimal("0.00")
        assert invoice.status == InvoiceStatus.PAID

        await db_session.refresh(order)
        assert order.payment_status == PaymentStatus.FULLY_PAID

        # 5. Verify Webhook Event Record
        stmt = select(PaymentWebhookEvent).where(PaymentWebhookEvent.event_id == event_id)
        webhook_rec = (await db_session.execute(stmt)).scalars().first()
        assert webhook_rec is not None
        assert webhook_rec.status == WebhookEventStatus.PROCESSED
        assert webhook_rec.signature_verified is True


@pytest.mark.asyncio
async def test_invalid_and_missing_signature_rejected():
    """
    Security Test: Invalid or missing cryptographic signature must return 401 Unauthorized.
    """
    payload_bytes = json.dumps({"event_id": "evt_invalid", "event_type": "payment.captured"}).encode("utf-8")

    with TestClient(app) as client:
        # 1. Missing signature -> 401
        res1 = client.post("/api/v1/webhooks/payments/generic", data=payload_bytes, headers={"Content-Type": "application/json"})
        assert res1.status_code == 401

        # 2. Invalid/Wrong signature -> 401
        res2 = client.post(
            "/api/v1/webhooks/payments/generic",
            data=payload_bytes,
            headers={"Content-Type": "application/json", "X-Webhook-Signature": "wrong_signature_12345"},
        )
        assert res2.status_code == 401

        # 3. Tampered payload with original signature -> 401
        valid_sig = generate_hmac_signature(payload_bytes)
        tampered_bytes = json.dumps({"event_id": "evt_invalid", "event_type": "payment.captured", "tampered": True}).encode("utf-8")
        res3 = client.post(
            "/api/v1/webhooks/payments/generic",
            data=tampered_bytes,
            headers={"Content-Type": "application/json", "X-Webhook-Signature": valid_sig},
        )
        assert res3.status_code == 401


@pytest.mark.asyncio
async def test_idempotent_duplicate_event_handling(db_session: AsyncSession):
    """
    Idempotency Test: Sending the exact same webhook twice does not double-apply payment.
    """
    customer = Customer(id=uuid.uuid4(), full_name="Idem Co", customer_type=CustomerType.WHOLESALE_MERCHANT, phone="+919840776655", city="Salem")
    db_session.add(customer)
    await db_session.flush()

    invoice = Invoice(
        id=uuid.uuid4(),
        invoice_number=f"INV-IDEM-{uuid.uuid4().hex[:6]}",
        invoice_type=InvoiceType.TAX_INVOICE,
        customer_id=customer.id,
        invoice_date=date.today(),
        due_date=date.today(),
        subtotal_amount=Decimal("50000.00"),
        total_tax_amount=Decimal("2500.00"),
        total_amount=Decimal("52500.00"),
        paid_amount=Decimal("0.00"),
        balance_due=Decimal("52500.00"),
        status=InvoiceStatus.ISSUED,
    )
    db_session.add(invoice)
    await db_session.commit()

    event_id = f"evt_idem_{uuid.uuid4().hex[:8]}"
    payload_dict = {
        "event_id": event_id,
        "event_type": "payment.captured",
        "payment": {
            "id": f"pay_idem_{uuid.uuid4().hex[:6]}",
            "amount": 52500.00,
            "currency": "INR",
            "notes": {"invoice_id": str(invoice.id)},
        },
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    sig = generate_hmac_signature(payload_bytes)
    headers = {"Content-Type": "application/json", "X-Webhook-Signature": sig}

    with TestClient(app) as client:
        # First Delivery -> 200 Success
        res1 = client.post("/api/v1/webhooks/payments/generic", data=payload_bytes, headers=headers)
        assert res1.status_code == 200
        assert res1.json()["status"] == "success"

        # Second Delivery -> 200 Duplicate (Idempotent ignore)
        res2 = client.post("/api/v1/webhooks/payments/generic", data=payload_bytes, headers=headers)
        assert res2.status_code == 200
        assert res2.json()["status"] == "duplicate"

        # Verify DB paid amount is exactly 52,500 (not doubled)
        await db_session.refresh(invoice)
        assert invoice.paid_amount == Decimal("52500.00")
        assert invoice.balance_due == Decimal("0.00")


@pytest.mark.asyncio
async def test_overpayment_and_currency_mismatch_rejected(db_session: AsyncSession):
    """
    Validation Test: Overpayment and non-INR currencies are rejected.
    """
    customer = Customer(id=uuid.uuid4(), full_name="Validation Co", customer_type=CustomerType.WHOLESALE_MERCHANT, phone="+919840554433", city="Erode")
    db_session.add(customer)
    await db_session.flush()

    invoice = Invoice(
        id=uuid.uuid4(),
        invoice_number=f"INV-VAL-{uuid.uuid4().hex[:6]}",
        invoice_type=InvoiceType.TAX_INVOICE,
        customer_id=customer.id,
        invoice_date=date.today(),
        due_date=date.today(),
        total_amount=Decimal("20000.00"),
        paid_amount=Decimal("0.00"),
        balance_due=Decimal("20000.00"),
        status=InvoiceStatus.ISSUED,
    )
    db_session.add(invoice)
    await db_session.commit()

    with TestClient(app) as client:
        # 1. Overpayment: Attempt to pay 30,000 for a 20,000 invoice
        overpay_dict = {
            "event_id": f"evt_over_{uuid.uuid4().hex[:6]}",
            "event_type": "payment.captured",
            "payment": {"amount": 30000.00, "currency": "INR", "notes": {"invoice_id": str(invoice.id)}},
        }
        overpay_bytes = json.dumps(overpay_dict).encode("utf-8")
        res1 = client.post(
            "/api/v1/webhooks/payments/generic",
            data=overpay_bytes,
            headers={"Content-Type": "application/json", "X-Webhook-Signature": generate_hmac_signature(overpay_bytes)},
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "failed"
        assert "Overpayment rejected" in res1.json()["error"]

        # 2. Currency mismatch: USD instead of INR
        curr_dict = {
            "event_id": f"evt_curr_{uuid.uuid4().hex[:6]}",
            "event_type": "payment.captured",
            "payment": {"amount": 20000.00, "currency": "USD", "notes": {"invoice_id": str(invoice.id)}},
        }
        curr_bytes = json.dumps(curr_dict).encode("utf-8")
        res2 = client.post(
            "/api/v1/webhooks/payments/generic",
            data=curr_bytes,
            headers={"Content-Type": "application/json", "X-Webhook-Signature": generate_hmac_signature(curr_bytes)},
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "failed"
        assert "Currency mismatch" in res2.json()["error"]


@pytest.mark.asyncio
async def test_admin_webhook_events_listing(db_session: AsyncSession):
    """
    Audit Test: Admin can query webhook events log.
    """
    admin_user = User(
        id=uuid.uuid4(),
        email=f"admin_wh_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("AdminPass@123"),
        full_name="Admin WH",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.commit()

    token = create_access_token(subject=str(admin_user.id), role=admin_user.role.value)

    with TestClient(app) as client:
        resp = client.get("/api/v1/webhooks/events", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert "items" in resp.json()
        assert "total" in resp.json()
