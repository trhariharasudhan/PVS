import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial, MaterialType, UnitOfMeasure
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_no_sensitive_business_data_leakage(async_client: AsyncClient, db_session: AsyncSession):
    """
    Security Test: Ensure that public product and category API responses
    NEVER leak supplier info, raw material data, user credentials,
    exact warehouse counts, or production costs.
    """
    # Create internal data
    user = User(
        id=uuid.uuid4(),
        email="super.secret.admin@pvssilks.test",
        hashed_password="$2b$12$super_secret_argon2_password_hash",
        full_name="Secret Admin",
        role=UserRole.SUPER_ADMIN,
    )
    supplier = Supplier(
        id=uuid.uuid4(),
        supplier_code="SUP-CONF-001",
        supplier_name="Secret Filature Supplier",
        contact_person="Internal Person",
        phone="+919999999999",
        location="Confidential Mill",
    )
    category = Category(id=uuid.uuid4(), name="Secured Silk", slug="secured-silk")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-SEC-001",
        name="Secured Test Saree",
        category=category,
        fabric="Pure Silk",
        color="Ruby Red",
        border="Gold Zari",
        weave_type="Korvai",
        description="Public description",
        price=Decimal("15000.00"),
        availability_status=AvailabilityStatus.IN_STOCK,
    )
    inventory = Inventory(
        id=uuid.uuid4(),
        product=product,
        quantity_on_hand=143,  # Internal stock count
        quantity_reserved=12,
        reorder_threshold=5,
        warehouse_location="CONFIDENTIAL-BAY-9",
    )
    raw_material = RawMaterial(
        id=uuid.uuid4(),
        material_code="RAW-CONF-001",
        name="Confidential Mulberry Yarn",
        material_type=MaterialType.RAW_SILK,
        unit_of_measure=UnitOfMeasure.KILOGRAMS,
        supplier=supplier,
    )

    db_session.add_all([user, supplier, category, product, inventory, raw_material])
    await db_session.commit()

    # Query product list endpoint
    resp_list = await async_client.get("/api/v1/products")
    assert resp_list.status_code == 200
    list_content = resp_list.text

    # Assert that sensitive data strings do NOT appear in response body
    assert "super_secret" not in list_content
    assert "super.secret.admin" not in list_content
    assert "Secret Filature Supplier" not in list_content
    assert "CONFIDENTIAL-BAY-9" not in list_content
    assert "Confidential Mulberry Yarn" not in list_content
    assert "quantity_on_hand" not in list_content
    assert "143" not in list_content  # Internal exact quantity must not be leaked

    # Query product detail endpoint
    resp_detail = await async_client.get(f"/api/v1/products/{product.id}")
    assert resp_detail.status_code == 200
    detail_content = resp_detail.text

    assert "CONFIDENTIAL-BAY-9" not in detail_content
    assert "quantity_on_hand" not in detail_content
    assert "Secret Filature Supplier" not in detail_content
    assert "RAW-CONF-001" not in detail_content


@pytest.mark.asyncio
async def test_pagination_bounds_and_safety(async_client: AsyncClient):
    """Test pagination bounds (limit cap to 100 and minimum 1)."""
    # Test limit > 100 returns 422 or caps gracefully
    resp_large = await async_client.get("/api/v1/products?limit=500")
    assert resp_large.status_code in [200, 422]
    if resp_large.status_code == 200:
        assert resp_large.json()["limit"] <= 100

    # Test negative or 0 limit returns 422 validation error
    resp_zero = await async_client.get("/api/v1/products?limit=0")
    assert resp_zero.status_code == 422


@pytest.mark.asyncio
async def test_security_response_headers(async_client: AsyncClient):
    """Test that all API responses contain mandatory HTTP defense-in-depth security headers."""
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in resp.headers.get("Permissions-Policy", "")


@pytest.mark.asyncio
async def test_unauthenticated_admin_endpoints_return_401(async_client: AsyncClient):
    """Verify that unauthenticated requests to protected admin endpoints strictly return 401."""
    admin_routes = [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/invoices",
        "/api/v1/admin/finance/overview",
        "/api/v1/admin/finance/receivables",
        "/api/v1/admin/reports/sales",
        "/api/v1/admin/inventory",
        "/api/v1/admin/production",
        "/api/v1/admin/suppliers",
    ]
    for route in admin_routes:
        res = await async_client.get(route)
        assert res.status_code == 401, f"Route {route} was not protected by 401"


@pytest.mark.asyncio
async def test_role_based_access_control_escalation_prevention(async_client: AsyncClient, db_session: AsyncSession):
    """Verify that lower privileged roles (e.g. DEALER) cannot access sensitive financial/report endpoints."""
    from app.core.security import get_password_hash, create_access_token
    dealer = User(
        id=uuid.uuid4(),
        email="dealer.test@pvssilks.test",
        hashed_password=get_password_hash("dealer_pass_123"),
        full_name="Test Dealer Staff",
        role=UserRole.DEALER,
        is_active=True,
    )
    db_session.add(dealer)
    await db_session.commit()

    token = create_access_token(subject=str(dealer.id), role=dealer.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # DEALER attempting to access financial overview must receive 403 Forbidden
    res_finance = await async_client.get("/api/v1/admin/finance/overview", headers=headers)
    assert res_finance.status_code == 403

    # DEALER attempting to access sales reports must receive 403 Forbidden
    res_reports = await async_client.get("/api/v1/admin/reports/sales", headers=headers)
    assert res_reports.status_code == 403


@pytest.mark.asyncio
async def test_inactive_staff_user_token_rejected(async_client: AsyncClient, db_session: AsyncSession):
    """Verify that an inactive staff user token is rejected with 401."""
    from app.core.security import get_password_hash, create_access_token
    inactive_admin = User(
        id=uuid.uuid4(),
        email="disabled.admin@pvssilks.test",
        hashed_password=get_password_hash("disabled_pass_123"),
        full_name="Disabled Administrator",
        role=UserRole.SUPER_ADMIN,
        is_active=False,  # Disabled account
    )
    db_session.add(inactive_admin)
    await db_session.commit()

    token = create_access_token(subject=str(inactive_admin.id), role=inactive_admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    res = await async_client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 401

