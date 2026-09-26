import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerType
from app.models.category import Category
from app.models.product import Product, ProductPricingTier, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.payment import Payment, PaymentType, PaymentMethod, PaymentRecordStatus
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_dealer_portal_full_e2e_workflow(db_session: AsyncSession):
    """
    E2E Test for Phase 6-02:
    1. Create Wholesale Customer & Dealer User.
    2. Create Product with Pricing Tiers and Inventory.
    3. Dealer browses catalogue and fetches product detail.
    4. Dealer calculates quote for 10 units (qualifying for Tier 1 discount).
    5. Dealer places order.
    6. Verifies server-calculated pricing, 5% GST, and atomic stock reservation.
    7. Verifies Dealer order history and IDOR protection.
    8. Verifies Dealer credit summary & ledger.
    """
    # 1. Setup Customer & Dealer User
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Kanchi Silks Emporium",
        company_name="Kanchi Silks Pvt Ltd",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919840998877",
        email="orders@kanchisilks.example.com",
        gstin="33AABCK9988E1Z4",
        city="Kanchipuram",
        state="Tamil Nadu",
        shipping_address="44, Gandhi Road, Kanchipuram",
    )
    db_session.add(customer)
    await db_session.commit()

    dealer_user = User(
        id=uuid.uuid4(),
        email=f"dealer_portal_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("DealerSecure@123"),
        full_name="Ramesh Dealer",
        role=UserRole.DEALER,
        is_active=True,
        customer_id=customer.id,
    )
    db_session.add(dealer_user)
    await db_session.commit()

    # 2. Setup Category, Product, Pricing Tiers, and Inventory
    category = Category(
        id=uuid.uuid4(),
        name="Bridal Muhurtham Silks",
        slug=f"bridal-muhurtham-{uuid.uuid4().hex[:4]}",
        description="Premium bridal weaves",
    )
    db_session.add(category)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        code=f"KAN-PORTAL-{uuid.uuid4().hex[:4]}",
        name="Royal Crimson Zari Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Red",
        border="Heavy Pure Gold Zari",
        weave_type="Traditional Korvai Pit Loom",
        description="Royal wedding collection silk saree.",
        price=Decimal("40000.00"),  # Retail MSRP
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()

    # Pricing Tier (10+ units = 32,000 INR per unit)
    tier1 = ProductPricingTier(
        id=uuid.uuid4(),
        product_id=product.id,
        tier_name="Bulk 10+ Units",
        min_quantity=10,
        tier_price=Decimal("32000.00"),
        is_active=True,
    )
    db_session.add(tier1)

    # Inventory (50 units on hand, 0 reserved)
    inv = Inventory(
        id=uuid.uuid4(),
        product_id=product.id,
        quantity_on_hand=50,
        quantity_reserved=0,
        reorder_threshold=5,
    )
    db_session.add(inv)
    await db_session.commit()

    token = create_access_token(subject=str(dealer_user.id), role=dealer_user.role.value)
    auth_headers = {"Authorization": f"Bearer {token}"}

    with TestClient(app) as client:
        # 3. Browse Catalogue
        cat_resp = client.get("/api/v1/dealer/products", headers=auth_headers)
        assert cat_resp.status_code == 200
        cat_data = cat_resp.json()
        assert len(cat_data["items"]) >= 1

        # 4. Product Detail
        det_resp = client.get(f"/api/v1/dealer/products/{product.id}", headers=auth_headers)
        assert det_resp.status_code == 200
        det_data = det_resp.json()
        assert det_data["code"] == product.code
        assert det_data["available_stock"] == 50
        assert len(det_data["pricing_tiers"]) == 1
        assert det_data["pricing_tiers"][0]["tier_price"] == 32000.00

        # 5. Calculate Quote for 10 units (Qualifies for Tier 1: 32000 per unit)
        quote_payload = {"product_id": str(product.id), "quantity": 10}
        quote_resp = client.post("/api/v1/dealer/calculate-quote", json=quote_payload, headers=auth_headers)
        assert quote_resp.status_code == 200
        q_data = quote_resp.json()
        assert q_data["effective_unit_price"] == 32000.00
        assert q_data["total_amount"] == 320000.00
        assert q_data["discount_per_unit"] == 8000.00  # 40000 - 32000
        assert q_data["total_savings"] == 80000.00

        # 6. Place Wholesale Order for 10 units
        order_payload = {
            "items": [{"product_id": str(product.id), "quantity": 10, "custom_notes": "Standard gold border packaging"}],
            "notes": "Urgent wedding order dispatch",
        }
        order_resp = client.post("/api/v1/dealer/orders", json=order_payload, headers=auth_headers)
        assert order_resp.status_code == 201
        ord_data = order_resp.json()
        assert ord_data["order_type"] == "WHOLESALE_BULK"
        assert ord_data["order_status"] == "PENDING"
        assert ord_data["subtotal_amount"] == 320000.00
        assert ord_data["tax_amount"] == 16000.00  # 5% of 320,000 = 16,000
        assert ord_data["total_amount"] == 336000.00  # Subtotal + 5% GST
        order_id = ord_data["id"]

        # Verify stock reservation in DB
        await db_session.refresh(inv)
        assert inv.quantity_reserved == 10
        assert inv.quantity_on_hand == 50  # On hand unchanged until dispatch

        # 7. List Dealer Orders
        orders_resp = client.get("/api/v1/dealer/orders", headers=auth_headers)
        assert orders_resp.status_code == 200
        orders_data = orders_resp.json()
        assert orders_data["total"] >= 1
        assert any(o["id"] == order_id for o in orders_data["items"])

        # 8. Order Detail (IDOR Protected)
        single_ord_resp = client.get(f"/api/v1/dealer/orders/{order_id}", headers=auth_headers)
        assert single_ord_resp.status_code == 200
        s_data = single_ord_resp.json()
        assert s_data["id"] == order_id
        assert len(s_data["items"]) == 1
        assert s_data["items"][0]["unit_price"] == 32000.00

        # 9. Credit Summary & Ledger
        cred_resp = client.get("/api/v1/dealer/credit", headers=auth_headers)
        assert cred_resp.status_code == 200
        cred_data = cred_resp.json()
        assert cred_data["credit_limit"] == 500000.00
        assert cred_data["available_credit"] == 500000.00

        ledger_resp = client.get("/api/v1/dealer/ledger", headers=auth_headers)
        assert ledger_resp.status_code == 200
        ledger_data = ledger_resp.json()
        assert "credit_summary" in ledger_data
        assert "invoices" in ledger_data
        assert "payments" in ledger_data


@pytest.mark.asyncio
async def test_dealer_order_idor_isolation(db_session: AsyncSession):
    """
    Security Test: IDOR Protection.
    Dealer A cannot access Dealer B's order.
    """
    # Create Customer A & Dealer A
    cust_a = Customer(
        id=uuid.uuid4(),
        full_name="Dealer A Co",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919840111111",
        city="Chennai",
    )
    db_session.add(cust_a)
    dealer_a = User(
        id=uuid.uuid4(),
        email=f"dealer_a_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("PassA@123"),
        full_name="Dealer A",
        role=UserRole.DEALER,
        customer_id=cust_a.id,
    )
    db_session.add(dealer_a)

    # Create Customer B & Dealer B
    cust_b = Customer(
        id=uuid.uuid4(),
        full_name="Dealer B Co",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919840222222",
        city="Madurai",
    )
    db_session.add(cust_b)
    dealer_b = User(
        id=uuid.uuid4(),
        email=f"dealer_b_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
        hashed_password=get_password_hash("PassB@123"),
        full_name="Dealer B",
        role=UserRole.DEALER,
        customer_id=cust_b.id,
    )
    db_session.add(dealer_b)
    await db_session.commit()

    # Product
    category = Category(id=uuid.uuid4(), name="Silks", slug=f"silks-{uuid.uuid4().hex[:4]}")
    db_session.add(category)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        code=f"KAN-IDOR-{uuid.uuid4().hex[:4]}",
        name="IDOR Test Silk",
        category_id=category.id,
        fabric="Silk",
        color="Gold",
        border="Zari",
        weave_type="Korvai",
        description="Test",
        price=Decimal("25000.00"),
        is_active=True,
    )
    db_session.add(product)
    inv = Inventory(id=uuid.uuid4(), product_id=product.id, quantity_on_hand=20, quantity_reserved=0)
    db_session.add(inv)
    await db_session.commit()

    token_a = create_access_token(subject=str(dealer_a.id), role=dealer_a.role.value)
    token_b = create_access_token(subject=str(dealer_b.id), role=dealer_b.role.value)

    with TestClient(app) as client:
        # Dealer A creates order
        order_resp = client.post(
            "/api/v1/dealer/orders",
            json={"items": [{"product_id": str(product.id), "quantity": 2}]},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert order_resp.status_code == 201
        order_a_id = order_resp.json()["id"]

        # Dealer B attempts to access Dealer A's order by UUID -> Must return 404
        idor_resp = client.get(
            f"/api/v1/dealer/orders/{order_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert idor_resp.status_code == 404
        assert "not found or you do not have permission" in idor_resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_dealer_order_insufficient_stock_fails(db_session: AsyncSession):
    """
    Validation Test: Ordering more stock than available fails with 400 Bad Request.
    """
    cust = Customer(id=uuid.uuid4(), full_name="Stock Test Co", customer_type=CustomerType.WHOLESALE_MERCHANT, phone="+919840333333", city="Salem")
    db_session.add(cust)
    dealer = User(id=uuid.uuid4(), email=f"dealer_stock_{uuid.uuid4().hex[:6]}@pvssilks.example.com", hashed_password=get_password_hash("Pass@123"), full_name="Stock Tester", role=UserRole.DEALER, customer_id=cust.id)
    db_session.add(dealer)

    category = Category(id=uuid.uuid4(), name="Stock Test", slug=f"stock-test-{uuid.uuid4().hex[:4]}")
    db_session.add(category)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        code=f"KAN-STK-{uuid.uuid4().hex[:4]}",
        name="Low Stock Saree",
        category_id=category.id,
        fabric="Silk",
        color="Green",
        border="Zari",
        weave_type="Korvai",
        description="Test",
        price=Decimal("30000.00"),
        is_active=True,
    )
    db_session.add(product)
    inv = Inventory(id=uuid.uuid4(), product_id=product.id, quantity_on_hand=3, quantity_reserved=0)
    db_session.add(inv)
    await db_session.commit()

    token = create_access_token(subject=str(dealer.id), role=dealer.role.value)

    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/dealer/orders",
            json={"items": [{"product_id": str(product.id), "quantity": 5}]},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400
        assert "Insufficient stock" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_dealer_unauthenticated_and_rbac_rejection(db_session: AsyncSession):
    """
    Security Test: Unauthenticated requests and non-dealer roles are blocked.
    """
    with TestClient(app) as client:
        # 1. Unauthenticated request -> 401 Unauthorized
        resp = client.get("/api/v1/dealer/orders")
        assert resp.status_code == 401

        # 2. Non-dealer role (e.g. FACTORY_MANAGER) -> 403 Forbidden
        factory_user = User(
            id=uuid.uuid4(),
            email=f"factory_{uuid.uuid4().hex[:6]}@pvssilks.example.com",
            hashed_password=get_password_hash("Pass@123"),
            full_name="Factory Staff",
            role=UserRole.FACTORY_MANAGER,
        )
        db_session.add(factory_user)
        await db_session.commit()

        factory_token = create_access_token(subject=str(factory_user.id), role=factory_user.role.value)
        rbac_resp = client.get("/api/v1/dealer/orders", headers={"Authorization": f"Bearer {factory_token}"})
        assert rbac_resp.status_code == 403

