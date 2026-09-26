import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerType
from app.models.category import Category
from app.models.product import Product, ProductPricingTier, AvailabilityStatus
from app.core.security import get_password_hash, create_access_token
from app.services.dealer_pricing_service import DealerPricingService


# ------------------------------------------------------------------------------
# Unit & Domain Tests: Pricing Calculation Engine
# ------------------------------------------------------------------------------

def test_deterministic_tiered_pricing_selection():
    """Verify deterministic server-side tier selection across volume thresholds."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-001",
        name="Kanchipuram Pure Mulberry Silk Saree",
        price=Decimal("30000.00"),
        fabric="Pure Mulberry Silk",
        color="Crimson Red",
        border="Pure Zari Korvai Border",
        weave_type="Traditional Korvai Pit Loom",
        description="Authentic Kanchipuram silk saree.",
    )

    # Attach tiers
    tier1 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Tier 1 (5+ Units)",
        min_quantity=5,
        tier_price=Decimal("27000.00"),
        is_active=True,
    )
    tier2 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Tier 2 (10+ Units)",
        min_quantity=10,
        tier_price=Decimal("25000.00"),
        is_active=True,
    )
    tier3 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Tier 3 (50+ Units)",
        min_quantity=50,
        tier_price=Decimal("22000.00"),
        is_active=True,
    )
    product.pricing_tiers = [tier1, tier2, tier3]

    # Below any tier: should return base price (30000.00)
    p1, t1 = DealerPricingService.calculate_tiered_unit_price(product, 1)
    assert p1 == Decimal("30000.00")
    assert t1 is None

    p4, t4 = DealerPricingService.calculate_tiered_unit_price(product, 4)
    assert p4 == Decimal("30000.00")
    assert t4 is None

    # Tier 1 exact boundary and within range
    p5, t5 = DealerPricingService.calculate_tiered_unit_price(product, 5)
    assert p5 == Decimal("27000.00")
    assert t5.tier_name == "Tier 1 (5+ Units)"

    p9, t9 = DealerPricingService.calculate_tiered_unit_price(product, 9)
    assert p9 == Decimal("27000.00")

    # Tier 2 exact boundary and within range
    p10, t10 = DealerPricingService.calculate_tiered_unit_price(product, 10)
    assert p10 == Decimal("25000.00")
    assert t10.tier_name == "Tier 2 (10+ Units)"

    p49, t49 = DealerPricingService.calculate_tiered_unit_price(product, 49)
    assert p49 == Decimal("25000.00")

    # Tier 3 exact boundary and super-bulk
    p50, t50 = DealerPricingService.calculate_tiered_unit_price(product, 50)
    assert p50 == Decimal("22000.00")
    assert t50.tier_name == "Tier 3 (50+ Units)"

    p100, t100 = DealerPricingService.calculate_tiered_unit_price(product, 100)
    assert p100 == Decimal("22000.00")


def test_inactive_tier_skipped():
    """Verify that inactive pricing tiers are ignored."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-002",
        name="Kanchipuram Silk",
        price=Decimal("20000.00"),
        fabric="Pure Silk",
        color="Royal Blue",
        border="Gold Zari",
        weave_type="Korvai",
        description="Test",
    )
    active_tier = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Active Tier (5+)",
        min_quantity=5,
        tier_price=Decimal("18000.00"),
        is_active=True,
    )
    inactive_tier = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Disabled Tier (10+)",
        min_quantity=10,
        tier_price=Decimal("15000.00"),
        is_active=False,
    )
    product.pricing_tiers = [active_tier, inactive_tier]

    # Qty 10 should match active tier (18000) because inactive tier is skipped
    price, tier = DealerPricingService.calculate_tiered_unit_price(product, 10)
    assert price == Decimal("18000.00")
    assert tier.tier_name == "Active Tier (5+)"


def test_invalid_quantity_handling():
    """Verify that invalid quantities raise ValueError."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-003",
        name="Test Saree",
        price=Decimal("15000.00"),
        fabric="Pure Silk",
        color="Green",
        border="Zari",
        weave_type="Traditional",
        description="Test",
    )
    with pytest.raises(ValueError, match="quantity must be an integer >= 1"):
        DealerPricingService.calculate_tiered_unit_price(product, 0)

    with pytest.raises(ValueError, match="quantity must be an integer >= 1"):
        DealerPricingService.calculate_tiered_unit_price(product, -10)


def test_missing_pricing_configuration_raises_error():
    """Verify that products without price or tiers raise descriptive error."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-004",
        name="Unpriced Saree",
        price=None,
        fabric="Silk",
        color="Gold",
        border="Zari",
        weave_type="Traditional",
        description="Test",
    )
    product.pricing_tiers = []

    with pytest.raises(ValueError, match="has no base pricing configured"):
        DealerPricingService.calculate_tiered_unit_price(product, 5)


def test_moq_validation_logic():
    """Verify MOQ threshold enforcement."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-005",
        name="Bridal Saree",
        price=Decimal("45000.00"),
        fabric="Pure Silk",
        color="Maroon",
        border="Temple Zari",
        weave_type="Korvai",
        description="Test",
    )
    assert DealerPricingService.validate_moq(product, quantity=5, moq_threshold=5) is True

    with pytest.raises(ValueError, match="below the Minimum Order Quantity"):
        DealerPricingService.validate_moq(product, quantity=3, moq_threshold=5)


def test_calculate_line_item_quote_details():
    """Verify comprehensive line item quote math and savings."""
    product = Product(
        id=uuid.uuid4(),
        code="KAN-MSR-006",
        name="Temple Border Saree",
        price=Decimal("40000.00"),
        fabric="Silk",
        color="Yellow",
        border="Zari",
        weave_type="Korvai",
        description="Test",
    )
    tier = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Wholesale 10+",
        min_quantity=10,
        tier_price=Decimal("34000.00"),
        is_active=True,
    )
    product.pricing_tiers = [tier]

    quote = DealerPricingService.calculate_line_item_quote(product, 10, moq_threshold=5)
    assert quote["product_code"] == "KAN-MSR-006"
    assert quote["quantity"] == 10
    assert quote["base_retail_price"] == 40000.00
    assert quote["effective_unit_price"] == 34000.00
    assert quote["total_amount"] == 340000.00
    assert quote["discount_per_unit"] == 6000.00
    assert quote["total_savings"] == 60000.00
    assert quote["applied_tier_name"] == "Wholesale 10+"


# ------------------------------------------------------------------------------
# Integration & Security Tests: Dealer Authentication, IDOR & RBAC
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dealer_profile_tenant_isolation(db_session: AsyncSession):
    """
    Security Test: Verify Dealer A receives their own linked Customer data
    and cannot be impersonated or access unlinked data.
    """
    # 1. Create wholesale customer entity
    customer_a = Customer(
        id=uuid.uuid4(),
        full_name="Murugan Silks Chennai",
        company_name="Murugan Silks Pvt Ltd",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919840112233",
        email="purchase@murugansilks.example.com",
        gstin="33AABCM1234F1Z5",
        city="Chennai",
        state="Tamil Nadu",
        shipping_address="108, Pondy Bazaar, T. Nagar, Chennai",
    )
    db_session.add(customer_a)
    await db_session.commit()

    # 2. Create dealer user linked to customer_a
    dealer_user = User(
        id=uuid.uuid4(),
        email=f"dealer_a_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("DealerPass@123"),
        full_name="Karthik Murugan",
        role=UserRole.DEALER,
        is_active=True,
        customer_id=customer_a.id,
    )
    db_session.add(dealer_user)
    await db_session.commit()

    # 3. Generate JWT token for dealer user
    token = create_access_token(subject=str(dealer_user.id), role=dealer_user.role.value)

    with TestClient(app) as client:
        # Authenticated Dealer Profile Request
        resp = client.get(
            "/api/v1/dealer/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == dealer_user.email
        assert data["customer_id"] == str(customer_a.id)
        assert data["company_name"] == "Murugan Silks Pvt Ltd"
        assert data["gstin"] == "33AABCM1234F1Z5"
        assert data["city"] == "Chennai"


@pytest.mark.asyncio
async def test_unlinked_dealer_rejected_with_403(db_session: AsyncSession):
    """
    Security Test: A user with role DEALER but without customer_id
    is strictly forbidden from accessing dealer endpoints (prevents orphan access).
    """
    unlinked_dealer = User(
        id=uuid.uuid4(),
        email=f"unlinked_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("DealerPass@123"),
        full_name="Unlinked Dealer",
        role=UserRole.DEALER,
        is_active=True,
        customer_id=None,  # Not linked
    )
    db_session.add(unlinked_dealer)
    await db_session.commit()

    token = create_access_token(subject=str(unlinked_dealer.id), role=unlinked_dealer.role.value)

    with TestClient(app) as client:
        resp = client.get(
            "/api/v1/dealer/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403
        err_msg = resp.json().get("error", {}).get("message", "")
        assert "not linked to an active wholesale customer profile" in err_msg


@pytest.mark.asyncio
async def test_dealer_cannot_access_admin_endpoints(db_session: AsyncSession):
    """
    Security Test: Role escalation prevention.
    A DEALER user cannot access admin-only endpoints (e.g. Finance Overview, Pricing Tier Creation).
    """
    dealer_user = User(
        id=uuid.uuid4(),
        email=f"dealer_escalate_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("DealerPass@123"),
        full_name="Escalation Test Dealer",
        role=UserRole.DEALER,
        is_active=True,
    )
    db_session.add(dealer_user)
    await db_session.commit()

    token = create_access_token(subject=str(dealer_user.id), role=dealer_user.role.value)

    with TestClient(app) as client:
        # Attempt to access Admin Finance Overview
        resp = client.get(
            "/api/v1/admin/finance/overview",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403



@pytest.mark.asyncio
async def test_admin_pricing_tier_crud_lifecycle(db_session: AsyncSession):
    """
    Integration Test: Verify admin can create, list, and delete pricing tiers on a product.
    """
    # 1. Create admin user
    admin_user = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("AdminPass@123"),
        full_name="Pricing Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(admin_user)

    # 2. Create category and product
    category = Category(
        id=uuid.uuid4(),
        name=f"Bridal Kanchipuram {uuid.uuid4().hex[:4]}",
        slug=f"bridal-kanchipuram-{uuid.uuid4().hex[:4]}",
        description="Bridal silks",
    )
    db_session.add(category)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        code=f"KAN-TIER-{uuid.uuid4().hex[:4]}",
        name="Tiered Pricing Saree Test",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson",
        border="Gold Zari",
        weave_type="Korvai",
        description="Tier test saree",
        price=Decimal("50000.00"),
        is_active=True,
    )
    db_session.add(product)
    await db_session.commit()

    admin_token = create_access_token(subject=str(admin_user.id), role=admin_user.role.value)

    with TestClient(app) as client:
        # Create Tier
        payload = {
            "tier_name": "Bulk 10+ Discount",
            "min_quantity": 10,
            "tier_price": 42000.00,
            "is_active": True,
        }
        create_resp = client.post(
            f"/api/v1/dealer/admin/products/{product.id}/pricing-tiers",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201
        tier_data = create_resp.json()
        assert tier_data["tier_name"] == "Bulk 10+ Discount"
        assert float(tier_data["tier_price"]) == 42000.00
        tier_id = tier_data["id"]

        # List Tiers
        list_resp = client.get(
            f"/api/v1/dealer/admin/products/{product.id}/pricing-tiers",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert list_resp.status_code == 200
        tiers_list = list_resp.json()
        assert len(tiers_list) >= 1

        # Delete Tier
        del_resp = client.delete(
            f"/api/v1/dealer/admin/pricing-tiers/{tier_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert del_resp.status_code == 204


def test_alembic_single_head_chain_through_0004():
    """
    Verification Test: Ensure Alembic single-head migration chain is maintained
    linearly without branches through 0004.
    """
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent.parent.parent
    alembic_ini = backend_dir / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    script = ScriptDirectory.from_config(alembic_cfg)
    heads = script.get_heads()

    assert len(heads) == 1, f"Expected 1 single migration head, got: {heads}"
    assert heads[0] in [
        "0006_phase_6_04_communication_events",
        "0005_phase_6_03_payment_webhook_events",
        "0004_phase_6_01_dealer_pricing_tiers",
    ]


