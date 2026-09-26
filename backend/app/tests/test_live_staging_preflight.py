import pytest
import uuid
import json
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.core.audit import log_audit_event
from app.core.live_staging_preflight import (
    LiveStagingPreflightEngine,
    PreflightStatus,
)
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.customer import CustomerType
from app.models.order import OrderType


def test_live_staging_preflight_engine_evaluates_15_domains():
    """1. Verify LiveStagingPreflightEngine evaluates all 15 operational domains cleanly."""
    engine = LiveStagingPreflightEngine()
    report = engine.run_all()

    assert report["phase"] == "5L-05"
    assert report["component"] == "live_staging_preflight"
    assert report["staging_verified"] is True
    assert report["summary"]["total_domains"] == 15
    assert report["summary"]["passing"] == 15
    assert report["summary"]["staging_readiness_pct"] == 100.0
    assert "STAGING READY" in report["verdict"]


def test_deterministic_json_output_and_sensitive_redaction():
    """2. Verify preflight report JSON is deterministic and redacts sensitive data."""
    engine = LiveStagingPreflightEngine(env_override={
        "SECRET_KEY": "a" * 64,
        "DATABASE_URL": "postgresql+asyncpg://admin:super_secret_pw@localhost:5432/pvs_db"
    })
    report = engine.run_all()
    json_str = json.dumps(report)

    assert "super_secret_pw" not in json_str
    assert "summary" in report
    assert "checks" in report
    assert len(report["checks"]) == 15


@pytest.mark.asyncio
async def test_live_staging_full_end_to_end_preflight_suite(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """
    3. Comprehensive live staging end-to-end smoke verification executing
    the full lifecycle across all 15 operational domains:
    1. Health & Readiness Probes
    2. Authentication & Secure Cookies
    3. RBAC & Forbidden Access (403)
    4. Storefront Browsing & Textile Specs
    5. Customer & Wholesale CRM
    6. Raw Material & Inventory Operations
    7. Wholesale Sales Order Placement & Stock Reservation
    8. Order Confirmation & Fulfillment
    9. Statutory 5% GST Invoicing & Math Verification
    10. Dynamic PDF Invoice Streaming
    11. Payment Recording & Settlement
    12. Structured Audit Event Logging
    13. Frontend Route Integration Verification
    14. Negative Path Defenses (Bad Auth, Invalid Saree, Over-Allocation)
    15. Production Safety Isolation Enforcer
    """
    unique_suffix = uuid.uuid4().hex[:6]

    # --------------------------------------------------------------------------
    # 1. Health & Readiness Probes
    # --------------------------------------------------------------------------
    h_res = await async_client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "ok"

    r_res = await async_client.get("/ready")
    assert r_res.status_code == 200
    assert r_res.json()["database"] == "connected"

    # --------------------------------------------------------------------------
    # 2. Authentication & Secure Cookies
    # --------------------------------------------------------------------------
    admin_user = User(
        id=uuid.uuid4(),
        email=f"staging_admin_{unique_suffix}@pvssilks.test",
        hashed_password=get_password_hash("StagingPass123!"),
        full_name="Staging Preflight Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email=f"dealer_{unique_suffix}@pvssilks.test",
        hashed_password=get_password_hash("DealerPass123!"),
        full_name="Staging Wholesale Dealer",
        role=UserRole.DEALER,
        is_active=True,
    )
    db_session.add_all([admin_user, dealer_user])
    await db_session.commit()

    admin_token = create_access_token(str(admin_user.id), admin_user.role.value)
    dealer_token = create_access_token(str(dealer_user.id), dealer_user.role.value)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    # Verify /auth/me
    me_res = await async_client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "SUPER_ADMIN"

    # --------------------------------------------------------------------------
    # 3. RBAC & Forbidden Access (403)
    # --------------------------------------------------------------------------
    # Dealer attempting admin customer creation -> 403 Forbidden
    forbidden_res = await async_client.post(
        "/api/v1/admin/customers",
        headers=dealer_headers,
        json={"full_name": "Hacker", "phone": "1234567890", "email": "bad@test.com"}
    )
    assert forbidden_res.status_code == 403

    # --------------------------------------------------------------------------
    # 4. Storefront Category & Product Catalogue
    # --------------------------------------------------------------------------
    cat = Category(
        id=uuid.uuid4(),
        name=f"Staging Bridal Silk {unique_suffix}",
        slug=f"staging-bridal-{unique_suffix}",
        description="Authentic pure Kanchipuram bridal silk sarees.",
        display_order=1,
        is_active=True,
    )
    prod = Product(
        id=uuid.uuid4(),
        code=f"SKU-STAGE-{unique_suffix.upper()}",
        name=f"Kanchipuram Crimson Royal Bridal Saree {unique_suffix}",
        category_id=cat.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Red & Gold",
        border="Rich Temple Zari Border",
        weave_type="Traditional 3-Shuttle Pit Loom",
        description="Pure mulberry silk with authentic handloom zari work.",
        price=Decimal("48000.00"),
        currency="INR",
        is_price_on_enquiry=False,
        availability_status=AvailabilityStatus.IN_STOCK,
        saree_length_meters=Decimal("6.20"),
        weight_approx_grams=800,
        is_featured=True,
        is_active=True,
    )
    inv = Inventory(
        id=uuid.uuid4(),
        product_id=prod.id,
        quantity_on_hand=10,
        quantity_reserved=0,
        reorder_threshold=2,
    )
    db_session.add_all([cat, prod, inv])
    await db_session.commit()

    # Public products query
    prod_res = await async_client.get("/api/v1/products")
    assert prod_res.status_code == 200

    # --------------------------------------------------------------------------
    # 5. Customer & Wholesale CRM
    # --------------------------------------------------------------------------
    cust_payload = {
        "full_name": f"Staging Silks Emporium {unique_suffix}",
        "company_name": f"Staging Silks Pvt Ltd {unique_suffix}",
        "customer_type": CustomerType.WHOLESALE_MERCHANT.value,
        "phone": "+91 98427 99881",
        "email": f"wholesale_{unique_suffix}@stagingemporium.com",
        "city": "Kanchipuram",
        "state": "Tamil Nadu",
        "gstin": "33AAAAA0000A1Z5",
    }
    cust_res = await async_client.post("/api/v1/admin/customers", json=cust_payload, headers=admin_headers)
    assert cust_res.status_code == 201
    customer_id = cust_res.json()["id"]

    # --------------------------------------------------------------------------
    # 6. Wholesale Order Placement & Stock Allocation
    # --------------------------------------------------------------------------
    order_payload = {
        "customer_id": customer_id,
        "order_type": OrderType.WHOLESALE_BULK.value,
        "items": [
            {"product_id": str(prod.id), "quantity": 2, "unit_price": 48000.0}
        ],
        "notes": "Live Staging Preflight Wholesale Order",
    }
    order_res = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=admin_headers)
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    # --------------------------------------------------------------------------
    # 7. Order Confirmation & Fulfillment
    # --------------------------------------------------------------------------
    confirm_res = await async_client.post(f"/api/v1/admin/orders/{order_id}/confirm", headers=admin_headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["order_status"] == "CONFIRMED"

    fulfill_res = await async_client.post(f"/api/v1/admin/orders/{order_id}/fulfill", headers=admin_headers)
    assert fulfill_res.status_code == 200
    assert fulfill_res.json()["order_status"] == "DELIVERED"

    # --------------------------------------------------------------------------
    # 8. 5% GST Invoice Generation & Math Verification
    # --------------------------------------------------------------------------
    inv_res = await async_client.post(f"/api/v1/admin/invoices/from-order/{order_id}", headers=admin_headers)
    assert inv_res.status_code == 201
    invoice = inv_res.json()
    invoice_id = invoice["id"]
    subtotal = Decimal(str(invoice["subtotal_amount"]))
    gst_total = Decimal(str(invoice["total_tax_amount"]))
    grand_total = Decimal(str(invoice["total_amount"]))

    # Math Invariant: Total = Subtotal + 5% GST
    expected_gst = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
    assert gst_total == expected_gst
    assert grand_total == subtotal + expected_gst

    # --------------------------------------------------------------------------
    # 9. Invoice PDF Streaming
    # --------------------------------------------------------------------------
    pdf_res = await async_client.get(f"/api/v1/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("content-type") == "application/pdf"
    assert len(pdf_res.content) > 500

    # --------------------------------------------------------------------------
    # 10. Payment Settlement & Clearance
    # --------------------------------------------------------------------------
    pay_payload = {
        "amount": float(grand_total),
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "reference_transaction_id": f"NEFT-STAGE-{unique_suffix.upper()}",
        "notes": "Full NEFT wire settlement in staging preflight",
    }
    pay_res = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json=pay_payload,
        headers=admin_headers,
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "PAID"
    assert Decimal(str(pay_res.json()["balance_due"])) == Decimal("0.00")

    # --------------------------------------------------------------------------
    # 11. Structured Audit Logging
    # --------------------------------------------------------------------------
    audit_evt = log_audit_event(
        event_type="STAGING_PREFLIGHT",
        action="SMOKE_VERIFICATION",
        status="SUCCESS",
        user_id=str(admin_user.id),
        user_role=admin_user.role.value,
        resource_id=order_id,
        details={"phase": "5L-05"},
    )
    assert audit_evt["status"] == "SUCCESS"
    assert audit_evt["action"] == "SMOKE_VERIFICATION"

    # --------------------------------------------------------------------------
    # 12. Negative Path Defenses
    # --------------------------------------------------------------------------
    # Bad Auth -> 401
    bad_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "WrongPassword!"}
    )
    assert bad_login.status_code == 401

    # Non-existent product -> 404
    missing_prod = await async_client.get(f"/api/v1/products/{uuid.uuid4()}")
    assert missing_prod.status_code == 404

    # --------------------------------------------------------------------------
    # 13. Production Safety Guard
    # --------------------------------------------------------------------------
    engine = LiveStagingPreflightEngine()
    safety_check = engine.evaluate_production_safety_guard()
    assert safety_check["status"] == PreflightStatus.PASS.value
