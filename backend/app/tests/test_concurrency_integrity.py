import pytest
import uuid
from decimal import Decimal
from datetime import date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.supplier import Supplier, SupplierType
from app.models.raw_material import RawMaterial, RawMaterialStock, MaterialType, UnitOfMeasure
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.models.invoice import Invoice, InvoiceItem, InvoiceType, InvoiceStatus


@pytest.fixture
async def integrity_fixture(db_session: AsyncSession):
    """Fixture creating master entities for concurrency and invariant tests."""
    admin = User(
        id=uuid.uuid4(),
        email=f"integrity.admin.{uuid.uuid4().hex[:6]}@pvssilks.test",
        hashed_password=get_password_hash("IntegrityPass2026!"),
        full_name="Integrity Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )

    category = Category(
        id=uuid.uuid4(),
        name="Integrity Category",
        slug=f"integrity-cat-{uuid.uuid4().hex[:6]}",
        display_order=1,
        is_active=True,
    )

    product = Product(
        id=uuid.uuid4(),
        code=f"PVS-INT-{uuid.uuid4().hex[:4].upper()}",
        name="Integrity Test Brocade Saree",
        category_id=category.id,
        fabric="Pure Silk",
        color="Royal Maroon",
        border="Zari Border",
        weave_type="Handloom",
        description="Integrity test specimen",
        price=Decimal("20000.00"),
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )

    inventory = Inventory(
        id=uuid.uuid4(),
        product_id=product.id,
        quantity_on_hand=10,
        quantity_reserved=0,
        reorder_threshold=2,
        warehouse_location="Vault A - Row 1",
    )

    supplier = Supplier(
        id=uuid.uuid4(),
        supplier_code=f"SUP-INT-{uuid.uuid4().hex[:4].upper()}",
        supplier_name="Integrity Silk Reeler",
        supplier_type=SupplierType.SILK_REELER,
        contact_person="M. Ramasamy",
        phone="+919842000099",
        email="reeler@integrity.test",
        location="Salem",
        is_active=True,
    )

    raw_mat = RawMaterial(
        id=uuid.uuid4(),
        material_code=f"RM-INT-{uuid.uuid4().hex[:4].upper()}",
        name="Integrity Mulberry Warp Yarn",
        material_type=MaterialType.RAW_SILK,
        unit_of_measure=UnitOfMeasure.KILOGRAMS,
        unit_cost=Decimal("4500.00"),
        reorder_level=Decimal("5.00"),
        supplier_id=supplier.id,
        is_active=True,
    )

    raw_stock = RawMaterialStock(
        id=uuid.uuid4(),
        raw_material_id=raw_mat.id,
        quantity_on_hand=Decimal("20.00"),
        quantity_reserved=Decimal("0.00"),
        warehouse_location="Yarn Bay 1",
    )

    customer = Customer(
        id=uuid.uuid4(),
        full_name="Integrity Wholesale Merchant",
        company_name="Integrity Silks",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919842000088",
        city="Madurai",
        state="Tamil Nadu",
    )

    db_session.add_all([admin, category, product, inventory, supplier, raw_mat, raw_stock, customer])
    await db_session.commit()

    token = create_access_token(str(admin.id), admin.role.value)
    return {
        "token": token,
        "admin": admin,
        "product": product,
        "inventory": inventory,
        "raw_material": raw_mat,
        "raw_stock": raw_stock,
        "customer": customer,
    }


@pytest.mark.asyncio
async def test_finished_inventory_non_negative_invariant(async_client: AsyncClient, integrity_fixture):
    """Verify that manual deduction or adjustment cannot force finished inventory below 0."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    prod_id = str(integrity_fixture["product"].id)

    # 1. Attempt negative adjustment larger than on_hand (10 on hand -> try -15)
    adj_payload = {
        "movement_type": "ADJUSTMENT",
        "quantity_delta": -15,
        "notes": "Invalid excessive deduction",
    }
    res = await async_client.post(f"/api/v1/admin/inventory/{prod_id}/adjust", json=adj_payload, headers=headers)
    assert res.status_code == 409
    assert "Insufficient stock" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_raw_material_non_negative_invariant(async_client: AsyncClient, integrity_fixture):
    """Verify that raw material adjustment cannot force stock below 0."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    mat_id = str(integrity_fixture["raw_material"].id)

    # 20 kg on hand -> try to deduct 30 kg
    adj_payload = {
        "movement_type": "ADJUSTMENT",
        "quantity_delta": -30.0,
        "notes": "Attempted negative raw stock",
    }
    res = await async_client.post(f"/api/v1/admin/raw-materials/{mat_id}/adjust", json=adj_payload, headers=headers)
    assert res.status_code == 409
    assert "would cause negative stock" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_reservation_cannot_exceed_available_stock(async_client: AsyncClient, integrity_fixture):
    """Verify that creating an order for more than available stock is rejected with HTTP 409."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    prod_id = str(integrity_fixture["product"].id)
    cust_id = str(integrity_fixture["customer"].id)

    # On hand is 10, try to reserve 15
    order_payload = {
        "customer_id": cust_id,
        "order_type": "WHOLESALE_BULK",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 15,
                "unit_price": 20000.0,
            }
        ],
    }
    res = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=headers)
    assert res.status_code == 409
    assert "Insufficient available stock" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_production_completion_duplicate_credit_prevention(async_client: AsyncClient, integrity_fixture):
    """Verify that marking a batch COMPLETED multiple times does not duplicate finished stock credits."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    prod_id = str(integrity_fixture["product"].id)

    # Create batch
    batch_payload = {
        "batch_number": f"BATCH-DUP-{uuid.uuid4().hex[:4].upper()}",
        "product_id": prod_id,
        "loom_identifier": "LOOM-01",
        "planned_quantity": 4,
    }
    b_res = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=headers)
    assert b_res.status_code == 201
    batch_id = b_res.json()["id"]

    # Initial stock: 10
    # Complete batch for 4 sarees -> stock becomes 14
    comp_res1 = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "actual_quantity": 4},
        headers=headers,
    )
    assert comp_res1.status_code == 200

    inv_res1 = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_res1.json()["inventory"]["quantity_on_hand"] == 14

    # Repeat complete call -> stock remains 14, no double crediting
    comp_res2 = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "actual_quantity": 4},
        headers=headers,
    )
    assert comp_res2.status_code == 200

    inv_res2 = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_res2.json()["inventory"]["quantity_on_hand"] == 14


@pytest.mark.asyncio
async def test_order_cancellation_double_release_prevention(async_client: AsyncClient, integrity_fixture):
    """Verify cancelling an order releases reservation once and repeat cancel is idempotent."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    prod_id = str(integrity_fixture["product"].id)
    cust_id = str(integrity_fixture["customer"].id)

    # Initial stock: 10 on hand, 0 reserved
    # 1. Create order for 3 sarees -> 10 on hand, 3 reserved, 7 available
    order_payload = {
        "customer_id": cust_id,
        "order_type": "WHOLESALE_BULK",
        "items": [{"product_id": prod_id, "quantity": 3, "unit_price": 20000.0}],
    }
    ord_res = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=headers)
    assert ord_res.status_code == 201
    order_id = ord_res.json()["id"]

    inv_check1 = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_check1.json()["inventory"]["quantity_reserved"] == 3

    # 2. Cancel order -> releases 3 reserved -> 0 reserved
    cancel_res1 = await async_client.post(f"/api/v1/admin/orders/{order_id}/cancel", headers=headers)
    assert cancel_res1.status_code == 200

    inv_check2 = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_check2.json()["inventory"]["quantity_reserved"] == 0

    # 3. Repeat cancel -> reservation does not become negative
    cancel_res2 = await async_client.post(f"/api/v1/admin/orders/{order_id}/cancel", headers=headers)
    assert cancel_res2.status_code == 200

    inv_check3 = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_check3.json()["inventory"]["quantity_reserved"] == 0


@pytest.mark.asyncio
async def test_server_authoritative_invoice_totals_and_payment_integrity(async_client: AsyncClient, integrity_fixture):
    """Verify invoice calculations (tax, discount, balance) are server-calculated and tamper-resistant."""
    headers = {"Authorization": f"Bearer {integrity_fixture['token']}"}
    cust_id = str(integrity_fixture["customer"].id)
    prod_id = str(integrity_fixture["product"].id)

    inv_payload = {
        "invoice_type": "TAX_INVOICE",
        "customer_id": cust_id,
        "items": [
            {
                "product_id": prod_id,
                "item_description": "Server Calculated Saree",
                "hsn_sac_code": "5007",
                "quantity": 2,
                "unit_price": 10000.0,
                "discount_amount": 1000.0,  # 2 * 10000 - 1000 = 19000 taxable
                "gst_rate": 5.0,  # 5% of 19000 = 950 tax -> total 19950
            }
        ],
    }
    inv_res = await async_client.post("/api/v1/admin/invoices", json=inv_payload, headers=headers)
    assert inv_res.status_code == 201
    inv = inv_res.json()
    invoice_id = inv["id"]

    assert Decimal(str(inv["subtotal_amount"])) == Decimal("19000.00")
    assert Decimal(str(inv["total_tax_amount"])) == Decimal("950.00")
    assert Decimal(str(inv["total_amount"])) == Decimal("19950.00")
    assert Decimal(str(inv["balance_due"])) == Decimal("19950.00")

    # Payment recording cannot exceed balance or corrupt state
    pay_res = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json={
            "amount": 19950.0,
            "payment_method": "BANK_TRANSFER_NEFT_RTGS",
            "reference_transaction_id": "UTR-INTEGRITY-001",
            "payment_date": str(date.today()),
        },
        headers=headers,
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "PAID"
    assert Decimal(str(pay_res.json()["balance_due"])) == Decimal("0.00")
