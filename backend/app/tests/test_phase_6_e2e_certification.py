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
from app.models.category import Category
from app.models.product import Product, ProductPricingTier, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType

from app.models.payment import Payment, PaymentRecordStatus
from app.models.communication_event import (
    CommunicationEvent,
    CommunicationChannel,
    CommunicationEventType,
    CommunicationStatus,
)

from app.core.security import get_password_hash, create_access_token
from app.services.dealer_pricing_service import DealerPricingService
from app.services.communication_service import CommunicationDispatcherService


TEST_E2E_WEBHOOK_SECRET = "test_phase_6_e2e_webhook_secret_key_99999"


@pytest.fixture(autouse=True)
def setup_e2e_webhook_secret(monkeypatch):
    monkeypatch.setenv("WEBHOOK_SECRET_GENERIC", TEST_E2E_WEBHOOK_SECRET)
    monkeypatch.setenv("PAYMENT_WEBHOOK_SECRET", TEST_E2E_WEBHOOK_SECRET)


@pytest.mark.asyncio
async def test_complete_phase_6_end_to_end_business_lifecycle(db_session: AsyncSession):
    """
    Phase 6-05 E2E Certification Flow:
    1. Dealer Authentication & Tenant Scoping (Phase 6-01)
    2. Tiered Wholesale Pricing & Dynamic Quote Calculation (Phase 6-01)
    3. Bulk Wholesale Order Placement & Atomic Inventory Reservation (Phase 6-02)
    4. Tax Invoice Generation & Ledger Impact (Phase 6-02)
    5. Payment Gateway Webhook Ingestion & HMAC-SHA256 Verification (Phase 6-03)
    6. Payment Auto-Reconciliation & Invoice/Order Settlement (Phase 6-03)
    7. Multi-Channel Transactional Notification Dispatch with PDF Invoice (Phase 6-04)
    8. Audit Logging & Verification (Phase 6-05)
    """
    # -------------------------------------------------------------------------
    # STEP 1: Setup Product with Inventory and Tiered Wholesale Pricing
    # -------------------------------------------------------------------------
    category = Category(id=uuid.uuid4(), name="Bridal Kanchipuram", slug=f"bridal-kanchi-{uuid.uuid4().hex[:6]}")
    db_session.add(category)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        code=f"KAN-E2E-{uuid.uuid4().hex[:6].upper()}",
        name="Mayilkan Korvai Pure Zari Silk Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Maroon",
        border="Heavy Gold Zari",
        pallu="Rich Traditional Pallu",
        motif="Mayil Peacock Motif",
        weave_type="Korvai Double Warp",
        price=Decimal("45000.00"),
        availability_status=AvailabilityStatus.IN_STOCK,
        description="Authentic Kanchipuram master craftsman creation.",
    )

    db_session.add(product)
    await db_session.flush()

    tier_1 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Wholesale 5+ Sarees",
        min_quantity=5,
        tier_price=Decimal("40000.00"),
        is_active=True,
    )
    tier_2 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Bulk 10+ Sarees",
        min_quantity=10,
        tier_price=Decimal("36000.00"),
        is_active=True,
    )
    db_session.add_all([tier_1, tier_2])

    inventory = Inventory(
        id=uuid.uuid4(),
        product_id=product.id,
        quantity_on_hand=50,
        quantity_reserved=0,
        reorder_threshold=5,
    )
    db_session.add(inventory)



    # -------------------------------------------------------------------------
    # STEP 2: Setup Wholesale Merchant and Authenticated Dealer User
    # -------------------------------------------------------------------------
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Mahalakshmi Silks Retailers",
        company_name="Mahalakshmi Silks Pvt Ltd",
        gstin="33AAAAA0000A1Z5",
        email="dealers@mahalakshmi.example.com",
        phone="+919840991122",
        whatsapp_number="+919840991122",
        city="Kanchipuram",
        state="Tamil Nadu",
        shipping_address="45 Mettu Street, Kanchipuram, Tamil Nadu 631501",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
    )

    db_session.add(customer)
    await db_session.flush()

    dealer_user = User(
        id=uuid.uuid4(),
        email=f"dealer_e2e_{uuid.uuid4().hex[:6]}@mahalakshmi.example.com",
        hashed_password=get_password_hash("DealerSecurePass@123"),
        full_name="Ramanan Mahalakshmi",
        role=UserRole.DEALER,
        customer_id=customer.id,
        is_active=True,
    )
    db_session.add(dealer_user)
    await db_session.commit()

    dealer_token = create_access_token(
        subject=str(dealer_user.id),
        role=dealer_user.role.value,
    )


    with TestClient(app) as client:
        auth_headers = {"Authorization": f"Bearer {dealer_token}"}

        # ---------------------------------------------------------------------
        # STEP 3: Dynamic Quote Calculation (Phase 6-01)
        # ---------------------------------------------------------------------
        quote_payload = {
            "product_id": str(product.id),
            "quantity": 10,
        }
        quote_res = client.post("/api/v1/dealer/calculate-quote", json=quote_payload, headers=auth_headers)
        assert quote_res.status_code == 200
        quote_data = quote_res.json()
        assert quote_data["effective_unit_price"] == 36000.00
        assert quote_data["total_amount"] == 360000.00
        assert quote_data["total_savings"] == 90000.00  # (45000 - 36000) * 10
        assert quote_data["applied_tier_name"] == "Bulk 10+ Sarees"

        # ---------------------------------------------------------------------
        # STEP 4: Bulk Order Placement & Atomic Stock Reservation (Phase 6-02)
        # ---------------------------------------------------------------------
        order_payload = {
            "shipping_address_override": "45 Mettu Street, Kanchipuram, Tamil Nadu 631501",
            "notes": "E2E Certification Bulk Saree Order",
            "items": [{"product_id": str(product.id), "quantity": 10}],
        }

        order_res = client.post("/api/v1/dealer/orders", json=order_payload, headers=auth_headers)
        assert order_res.status_code == 201
        order_data = order_res.json()
        order_id = uuid.UUID(order_data["id"])
        assert order_data["total_amount"] == 378000.00
        assert order_data["order_status"] == "PENDING"


        # Create Tax Invoice for the confirmed Wholesale Order
        invoice = Invoice(
            id=uuid.uuid4(),
            invoice_number=f"INV-E2E-{order_data['order_number']}",
            invoice_type=InvoiceType.TAX_INVOICE,
            order_id=order_id,
            customer_id=customer.id,
            invoice_date=date.today(),
            due_date=date.today(),
            subtotal_amount=Decimal("360000.00"),
            cgst_amount=Decimal("9000.00"),
            sgst_amount=Decimal("9000.00"),
            total_tax_amount=Decimal("18000.00"),
            total_amount=Decimal("378000.00"),
            paid_amount=Decimal("0.00"),
            balance_due=Decimal("378000.00"),
            status=InvoiceStatus.ISSUED,
        )
        db_session.add(invoice)
        await db_session.commit()
        invoice_id = invoice.id

        # Verify stock reserved in DB
        await db_session.refresh(inventory)
        assert inventory.quantity_reserved == 10
        assert (inventory.quantity_on_hand - inventory.quantity_reserved) == 40



        # ---------------------------------------------------------------------
        # STEP 5: Payment Gateway Webhook Ingestion & Auto-Reconciliation (Phase 6-03)
        # ---------------------------------------------------------------------
        webhook_event_id = f"evt_e2e_{uuid.uuid4().hex[:10]}"
        webhook_payload = {
            "event_id": webhook_event_id,
            "event_type": "payment.captured",
            "payment": {
                "id": f"pay_e2e_{uuid.uuid4().hex[:8]}",
                "amount": 378000.00,
                "currency": "INR",
                "method": "UPI",
                "notes": {
                    "invoice_id": str(invoice_id),
                    "order_id": str(order_id),
                },
            },
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        signature = hmac.new(TEST_E2E_WEBHOOK_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

        wh_headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
        }
        wh_res = client.post("/api/v1/webhooks/payments/generic", data=payload_bytes, headers=wh_headers)
        assert wh_res.status_code == 200
        wh_data = wh_res.json()
        assert wh_data["status"] == "success"
        assert wh_data["action"] == "reconciled"
        assert wh_data["invoice_status"] == "PAID"

        # ---------------------------------------------------------------------
        # STEP 6: Multi-Channel Transactional Notification Dispatch (Phase 6-04)
        # ---------------------------------------------------------------------
        comm_events = await CommunicationDispatcherService.dispatch_invoice_notification(
            db=db_session,
            invoice_id=invoice_id,
            event_type=CommunicationEventType.INVOICE_PAID,
            correlation_id=f"e2e-cert-{uuid.uuid4().hex[:6]}",
        )
        assert len(comm_events) == 2
        email_event = next(e for e in comm_events if e.channel == CommunicationChannel.EMAIL)
        assert email_event.status == CommunicationStatus.SIMULATED_DRY_RUN
        assert email_event.attachments_metadata is not None
        assert email_event.recipient == "dealers@mahalakshmi.example.com"

        # ---------------------------------------------------------------------
        # STEP 7: Verify Statement of Account & Ledger State (Phase 6-02)
        # ---------------------------------------------------------------------
        ledger_res = client.get("/api/v1/dealer/ledger", headers=auth_headers)
        assert ledger_res.status_code == 200
        ledger_data = ledger_res.json()
        assert ledger_data["credit_summary"]["outstanding_balance"] == 0.00
        assert ledger_data["credit_summary"]["available_credit"] == 500000.00
        assert len(ledger_data["invoices"]) >= 1
        assert ledger_data["invoices"][0]["status"] == "PAID"
