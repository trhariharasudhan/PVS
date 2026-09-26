import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.customer import Customer, CustomerType
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def sales_fixture(db_session: AsyncSession):
    """Seed test admin accounts, category, product, inventory, and wholesale enquiry."""
    super_admin = User(
        id=uuid.uuid4(),
        email="super_sales@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Sales Director",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales_rep@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="B2B Account Manager",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory_view@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Loom Supervisor",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email="dealer_view@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Showroom Partner",
        role=UserRole.DEALER,
        is_active=True,
    )

    category = Category(
        id=uuid.uuid4(),
        name="Bridal Kanchipuram",
        slug="bridal-kanchipuram-sales",
        display_order=1,
        is_active=True,
    )

    product = Product(
        id=uuid.uuid4(),
        code="PVS-SALES-001",
        name="Royal Crimson Gold Zari Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Red",
        border="Brocade Temple",
        weave_type="Korvai Jacquard",
        description="Authentic bridal silk saree with pure gold zari brocade.",
        price=24000.00,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )

    inventory = Inventory(
        id=uuid.uuid4(),
        product_id=product.id,
        quantity_on_hand=30,
        quantity_reserved=0,
        reorder_threshold=5,
        warehouse_location="Vault A - Row 1",
    )

    customer = Customer(
        id=uuid.uuid4(),
        full_name="Meenakshi Sundaram",
        company_name="Sundaram Silk Emporium",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+91 98765 43210",
        email="meenakshi@sundaramsilks.com",
        city="Madurai",
        state="Tamil Nadu",
    )

    enquiry = WholesaleEnquiry(
        id=uuid.uuid4(),
        business_name="Sundaram Silk Emporium",
        contact_person="Meenakshi Sundaram",
        phone="+91 98765 43210",
        email="meenakshi@sundaramsilks.com",
        city="Madurai",
        business_type="Multi-Store Saree Showroom",
        number_of_stores="3",
        interested_collection="Bridal Kanchipuram",
        expected_quantity="20-50 pcs",
        message="Requesting wholesale terms for Deepavali wedding collection.",
        status=EnquiryStatus.NEW,
    )

    db_session.add_all([super_admin, sales_admin, factory_mgr, dealer_user, category, product, inventory, customer, enquiry])
    await db_session.commit()

    return {
        "super_token": create_access_token(str(super_admin.id), super_admin.role.value),
        "sales_token": create_access_token(str(sales_admin.id), sales_admin.role.value),
        "factory_token": create_access_token(str(factory_mgr.id), factory_mgr.role.value),
        "dealer_token": create_access_token(str(dealer_user.id), dealer_user.role.value),
        "product": product,
        "inventory": inventory,
        "customer": customer,
        "enquiry": enquiry,
    }


@pytest.mark.asyncio
async def test_customer_crud_and_search(async_client: AsyncClient, sales_fixture):
    """1. Test GET /api/v1/admin/customers and POST /api/v1/admin/customers."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}

    # 1. List customers
    res_list = await async_client.get("/api/v1/admin/customers?search=Sundaram", headers=headers)
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total"] >= 1
    assert data["items"][0]["full_name"] == "Meenakshi Sundaram"

    # 2. Create customer
    cust_payload = {
        "full_name": "Lakshmi Narayanan",
        "company_name": "Lakshmi Boutiques",
        "customer_type": "BOUTIQUE",
        "phone": "+91 94444 11223",
        "email": "lakshmi@boutiques.test",
        "city": "Chennai",
        "state": "Tamil Nadu",
    }
    res_create = await async_client.post("/api/v1/admin/customers", json=cust_payload, headers=headers)
    assert res_create.status_code == 201
    assert res_create.json()["company_name"] == "Lakshmi Boutiques"


@pytest.mark.asyncio
async def test_order_creation_and_inventory_reservation(async_client: AsyncClient, sales_fixture):
    """2. Test creating order calculates server totals, snapshots prices, and reserves stock."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}
    prod_id = str(sales_fixture["product"].id)
    cust_id = str(sales_fixture["customer"].id)

    order_payload = {
        "customer_id": cust_id,
        "order_type": "WHOLESALE_BULK",
        "payment_status": "PENDING",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 10,
                "unit_price": 22000.00,  # Agreed wholesale discounted price snapshot
                "custom_colorway_notes": "Deep maroon pallu contrast",
            }
        ],
        "tax_amount": 11000.00,  # 5% GST
        "shipping_amount": 1500.00,
        "notes": "Wedding season wholesale order #1",
    }

    res_order = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=headers)
    assert res_order.status_code == 201
    order_data = res_order.json()

    assert order_data["order_status"] == "PENDING"
    assert Decimal(str(order_data["subtotal_amount"])) == Decimal("220000.00")  # 10 * 22000
    assert Decimal(str(order_data["total_amount"])) == Decimal("232500.00")  # 220000 + 11000 + 1500
    assert len(order_data["items"]) == 1
    assert Decimal(str(order_data["items"][0]["unit_price"])) == Decimal("22000.00")

    # Verify inventory reservation (30 on hand, 10 reserved, 20 available)
    res_inv = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert res_inv.status_code == 200
    inv = res_inv.json()["inventory"]
    assert inv["quantity_on_hand"] == 30
    assert inv["quantity_reserved"] == 10
    assert inv["quantity_available"] == 20


@pytest.mark.asyncio
async def test_insufficient_stock_prevents_order(async_client: AsyncClient, sales_fixture):
    """3. Test order creation is blocked with 409 Conflict if available stock < requested."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}
    prod_id = str(sales_fixture["product"].id)
    cust_id = str(sales_fixture["customer"].id)

    # Attempt to order 500 sarees when only 30 exist
    invalid_order = {
        "customer_id": cust_id,
        "order_type": "WHOLESALE_BULK",
        "items": [{"product_id": prod_id, "quantity": 500}],
    }
    res = await async_client.post("/api/v1/admin/orders", json=invalid_order, headers=headers)
    assert res.status_code == 409
    assert "Insufficient available stock" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_order_cancellation_releases_reservation(async_client: AsyncClient, sales_fixture):
    """4. Test cancelling an order idempotently releases reserved stock back to available."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}
    prod_id = str(sales_fixture["product"].id)
    cust_id = str(sales_fixture["customer"].id)

    # 1. Create order for 8 sarees
    res_order = await async_client.post(
        "/api/v1/admin/orders",
        json={
            "customer_id": cust_id,
            "order_type": "RETAIL_DIRECT",
            "items": [{"product_id": prod_id, "quantity": 8}],
        },
        headers=headers,
    )
    assert res_order.status_code == 201
    order_id = res_order.json()["id"]

    # 2. Cancel order
    res_cancel = await async_client.post(f"/api/v1/admin/orders/{order_id}/cancel", headers=headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["order_status"] == "CANCELLED"

    # 3. Check inventory: reserved count should have decremented back to 0
    res_inv = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert res_inv.json()["inventory"]["quantity_reserved"] == 0

    # 4. Idempotency: Repeating cancel call returns CANCELLED without negative reserved stock
    res_cancel_again = await async_client.post(f"/api/v1/admin/orders/{order_id}/cancel", headers=headers)
    assert res_cancel_again.status_code == 200
    assert res_cancel_again.json()["order_status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_order_fulfillment_deducts_stock_and_logs_sale_movement(async_client: AsyncClient, sales_fixture):
    """5. Test fulfilling an order reduces on-hand stock and writes SALE movement ledger entry."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}
    prod_id = str(sales_fixture["product"].id)
    cust_id = str(sales_fixture["customer"].id)

    # 1. Create order for 5 sarees (initial on-hand: 30)
    res_order = await async_client.post(
        "/api/v1/admin/orders",
        json={
            "customer_id": cust_id,
            "order_type": "RETAIL_DIRECT",
            "items": [{"product_id": prod_id, "quantity": 5}],
        },
        headers=headers,
    )
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["id"]
    order_number = order_data["order_number"]

    # 2. Fulfill order
    res_fulfill = await async_client.post(f"/api/v1/admin/orders/{order_id}/fulfill", headers=headers)
    assert res_fulfill.status_code == 200
    assert res_fulfill.json()["order_status"] == "DELIVERED"

    # 3. Verify on_hand decreased by 5 (30 -> 25) and reserved decreased by 5 (5 -> 0)
    res_inv = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    inv = res_inv.json()["inventory"]
    assert inv["quantity_on_hand"] == 25
    assert inv["quantity_reserved"] == 0

    # 4. Verify SALE movement ledger entry
    movements = res_inv.json()["recent_movements"]
    assert len(movements) >= 1
    assert movements[0]["movement_type"] == "SALE"
    assert movements[0]["quantity_delta"] == -5
    assert movements[0]["reference_id"] == f"ORDER-{order_number}"

    # 5. Duplicate sale protection: Repeating fulfill does not deduct stock again
    res_fulfill_again = await async_client.post(f"/api/v1/admin/orders/{order_id}/fulfill", headers=headers)
    assert res_fulfill_again.status_code == 200

    res_inv_check = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert res_inv_check.json()["inventory"]["quantity_on_hand"] == 25


@pytest.mark.asyncio
async def test_wholesale_crm_pipeline_and_order_conversion(async_client: AsyncClient, sales_fixture):
    """6. Test wholesale CRM status progression and idempotent conversion to order."""
    headers = {"Authorization": f"Bearer {sales_fixture['sales_token']}"}
    enquiry_id = str(sales_fixture["enquiry"].id)
    prod_id = str(sales_fixture["product"].id)

    # 1. Update enquiry status: NEW -> CONTACTED -> NEGOTIATING
    res_step1 = await async_client.patch(
        f"/api/v1/admin/wholesale/{enquiry_id}",
        json={"status": "NEGOTIATING"},
        headers=headers,
    )
    assert res_step1.status_code == 200
    assert res_step1.json()["status"] == "NEGOTIATING"

    # 2. Convert Wholesale Enquiry to Order (12 sarees)
    convert_payload = {
        "items": [
            {
                "product_id": prod_id,
                "quantity": 12,
                "unit_price": 20000.00,
                "custom_colorway_notes": "Custom gold brocade border",
            }
        ],
        "order_type": "WHOLESALE_BULK",
        "notes": "Bulk trade order from Madurai showroom",
    }
    res_convert = await async_client.post(
        f"/api/v1/admin/wholesale/{enquiry_id}/convert",
        json=convert_payload,
        headers=headers,
    )
    assert res_convert.status_code == 201
    order_data = res_convert.json()
    assert order_data["order_type"] == "WHOLESALE_BULK"
    assert Decimal(str(order_data["subtotal_amount"])) == Decimal("240000.00")  # 12 * 20000
    converted_order_id = order_data["id"]

    # 3. Verify enquiry status is now CONVERTED_TO_ORDER
    res_enq = await async_client.get(f"/api/v1/admin/wholesale/{enquiry_id}", headers=headers)
    assert res_enq.status_code == 200
    assert res_enq.json()["status"] == "CONVERTED_TO_ORDER"

    # 4. IDEMPOTENCY: Repeated conversion returns existing order reference
    res_convert_again = await async_client.post(
        f"/api/v1/admin/wholesale/{enquiry_id}/convert",
        json=convert_payload,
        headers=headers,
    )
    assert res_convert_again.status_code == 201
    assert res_convert_again.json()["id"] == converted_order_id


@pytest.mark.asyncio
async def test_rbac_orders_and_wholesale(async_client: AsyncClient, sales_fixture):
    """7. Test RBAC permissions on orders and wholesale CRM endpoints."""
    prod_id = str(sales_fixture["product"].id)
    cust_id = str(sales_fixture["customer"].id)

    # 1. Factory Manager can READ orders and wholesale, but cannot CREATE orders (403)
    factory_headers = {"Authorization": f"Bearer {sales_fixture['factory_token']}"}
    res_factory_list = await async_client.get("/api/v1/admin/orders", headers=factory_headers)
    assert res_factory_list.status_code == 200

    res_factory_create = await async_client.post(
        "/api/v1/admin/orders",
        json={
            "customer_id": cust_id,
            "order_type": "RETAIL_DIRECT",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers=factory_headers,
    )
    assert res_factory_create.status_code == 403

    # 2. Dealer cannot access orders or wholesale CRM (403)
    dealer_headers = {"Authorization": f"Bearer {sales_fixture['dealer_token']}"}
    res_dealer_orders = await async_client.get("/api/v1/admin/orders", headers=dealer_headers)
    assert res_dealer_orders.status_code == 403

    res_dealer_crm = await async_client.get("/api/v1/admin/wholesale", headers=dealer_headers)
    assert res_dealer_crm.status_code == 403
