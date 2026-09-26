import pytest
import uuid
from decimal import Decimal
from datetime import date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderType, OrderStatus, PaymentStatus
from app.models.supplier import Supplier, SupplierType
from app.models.raw_material import (
    RawMaterial,
    RawMaterialStock,
    RawMaterialMovement,
    MaterialType,
    UnitOfMeasure,
    RawMaterialMovementType,
)
from app.models.purchase import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.production import ProductionBatch, BatchStatus
from app.models.payment import Payment, PaymentType, PaymentMethod, PaymentRecordStatus
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def procurement_fixture(db_session: AsyncSession):
    """Seed test admin accounts, supplier, raw material, product, and customer."""
    super_admin = User(
        id=uuid.uuid4(),
        email="super_proc@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Operations Director",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory_proc@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Weaving Master",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales_proc@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Sales Executive",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email="dealer_proc@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Showroom Partner",
        role=UserRole.DEALER,
        is_active=True,
    )

    supplier = Supplier(
        id=uuid.uuid4(),
        supplier_code="SUP-SILK-001",
        supplier_name="Kanchi Mulberry Reelers Society",
        supplier_type=SupplierType.SILK_REELER,
        contact_person="V. Ranganathan",
        phone="+91 94432 12345",
        email="ranganathan@kanchireelers.test",
        location="Kanchipuram, Tamil Nadu",
        address="142 Silk Weaver Colony, Kanchipuram",
        gstin="33AAAAA1234A1Z5",
        is_active=True,
    )

    raw_material = RawMaterial(
        id=uuid.uuid4(),
        material_code="RM-SILK-2A",
        name="Mulberry Raw Silk Yarn 2A Grade",
        material_type=MaterialType.RAW_SILK,
        unit_of_measure=UnitOfMeasure.KILOGRAMS,
        reorder_level=Decimal("20.00"),
        unit_cost=Decimal("4500.00"),
        description="Filature twisted raw mulberry silk yarn",
        is_active=True,
        supplier_id=supplier.id,
    )

    stock = RawMaterialStock(
        id=uuid.uuid4(),
        raw_material_id=raw_material.id,
        quantity_on_hand=Decimal("50.00"),
        quantity_reserved=Decimal("0.00"),
        warehouse_location="Yarn Bay 1",
    )

    category = Category(
        id=uuid.uuid4(),
        name="Kanchipuram Traditional",
        slug="kanchipuram-traditional-proc",
        display_order=1,
        is_active=True,
    )

    product = Product(
        id=uuid.uuid4(),
        code="PVS-PROD-PROC-1",
        name="Heritage Temple Border Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Mustard Yellow",
        border="Ganga Jamuna Temple",
        weave_type="Korvai",
        description="Traditional silk saree woven with 2A Mulberry silk.",
        price=Decimal("18500.00"),
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )

    customer = Customer(
        id=uuid.uuid4(),
        full_name="Kalyanaraman Silk House",
        company_name="Kalyanaraman Silks",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+91 98840 55667",
        city="Coimbatore",
        state="Tamil Nadu",
    )

    order = Order(
        id=uuid.uuid4(),
        order_number="PVS-ORD-99001",
        customer_id=customer.id,
        order_type=OrderType.WHOLESALE_BULK,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        subtotal_amount=Decimal("185000.00"),
        tax_amount=Decimal("9250.00"),
        shipping_amount=Decimal("1000.00"),
        total_amount=Decimal("195250.00"),
    )

    db_session.add_all([
        super_admin, factory_mgr, sales_admin, dealer_user,
        supplier, raw_material, stock, category, product, customer, order,
    ])
    await db_session.commit()

    return {
        "super_token": create_access_token(str(super_admin.id), super_admin.role.value),
        "factory_token": create_access_token(str(factory_mgr.id), factory_mgr.role.value),
        "sales_token": create_access_token(str(sales_admin.id), sales_admin.role.value),
        "dealer_token": create_access_token(str(dealer_user.id), dealer_user.role.value),
        "supplier": supplier,
        "raw_material": raw_material,
        "stock": stock,
        "product": product,
        "order": order,
        "customer": customer,
    }


@pytest.mark.asyncio
async def test_supplier_crud_and_uniqueness(async_client: AsyncClient, procurement_fixture):
    """1. Test Supplier CRUD and duplicate supplier code conflict."""
    headers = {"Authorization": f"Bearer {procurement_fixture['factory_token']}"}

    # 1. List suppliers
    res_list = await async_client.get("/api/v1/admin/suppliers?search=Mulberry", headers=headers)
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total"] >= 1
    assert data["items"][0]["supplier_code"] == "SUP-SILK-001"

    # 2. Create supplier
    new_sup = {
        "supplier_code": "SUP-ZARI-002",
        "supplier_name": "Surat Pure Zari Guild",
        "supplier_type": "ZARI_MANUFACTURER",
        "contact_person": "J. Prajapati",
        "phone": "+91 98250 99887",
        "location": "Surat, Gujarat",
        "address": "45 Ring Road Zari Market",
        "gstin": "24AAAAA5555A1Z1",
    }
    res_create = await async_client.post("/api/v1/admin/suppliers", json=new_sup, headers=headers)
    assert res_create.status_code == 201
    assert res_create.json()["supplier_code"] == "SUP-ZARI-002"

    # 3. Duplicate code conflict
    res_dup = await async_client.post("/api/v1/admin/suppliers", json=new_sup, headers=headers)
    assert res_dup.status_code == 409


@pytest.mark.asyncio
async def test_raw_material_crud_and_stock_initialization(async_client: AsyncClient, procurement_fixture):
    """2. Test Raw Material creation, stock baseline initialization, and duplicate code check."""
    headers = {"Authorization": f"Bearer {procurement_fixture['factory_token']}"}
    sup_id = str(procurement_fixture["supplier"].id)

    # Create raw material with initial stock baseline of 15.5 kg
    mat_payload = {
        "material_code": "RM-ZARI-GOLD-1",
        "name": "24K Gold Plated Silver Zari Thread",
        "material_type": "PURE_ZARI",
        "unit_of_measure": "KILOGRAMS",
        "reorder_level": 5.0,
        "unit_cost": 85000.0,
        "description": "Pure silver core with electroplated gold wrapping",
        "supplier_id": sup_id,
        "initial_stock": 15.5,
        "warehouse_location": "Vault Lock B-2",
    }

    res_create = await async_client.post("/api/v1/admin/raw-materials", json=mat_payload, headers=headers)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["material_code"] == "RM-ZARI-GOLD-1"
    assert Decimal(str(data["stock"]["quantity_on_hand"])) == Decimal("15.50")
    assert data["stock"]["stock_status"] == "IN_STOCK"
    assert len(data["recent_movements"]) >= 1
    assert data["recent_movements"][0]["movement_type"] == "PURCHASE_RECEIPT"

    # Duplicate code conflict
    res_dup = await async_client.post("/api/v1/admin/raw-materials", json=mat_payload, headers=headers)
    assert res_dup.status_code == 409


@pytest.mark.asyncio
async def test_raw_material_stock_adjustments_and_negative_stock_prevention(async_client: AsyncClient, procurement_fixture):
    """3. Test raw material manual stock adjustments and non-negative stock invariant."""
    headers = {"Authorization": f"Bearer {procurement_fixture['factory_token']}"}
    mat_id = str(procurement_fixture["raw_material"].id)

    # 1. Positive adjustment (+10 kg)
    res_adj_pos = await async_client.post(
        f"/api/v1/admin/raw-materials/{mat_id}/adjust",
        json={
            "movement_type": "ADJUSTMENT",
            "quantity_delta": 10.0,
            "reference_id": "AUDIT-CYCLE-1",
            "notes": "Physical audit surplus count",
        },
        headers=headers,
    )
    assert res_adj_pos.status_code == 200
    assert Decimal(str(res_adj_pos.json()["stock"]["quantity_on_hand"])) == Decimal("60.00")

    # 2. Negative adjustment (-5 kg)
    res_adj_neg = await async_client.post(
        f"/api/v1/admin/raw-materials/{mat_id}/adjust",
        json={
            "movement_type": "WASTAGE_DAMAGE",
            "quantity_delta": -5.0,
            "reference_id": "DAMAGE-LOG-1",
            "notes": "Spool moisture damage during monsoon",
        },
        headers=headers,
    )
    assert res_adj_neg.status_code == 200
    assert Decimal(str(res_adj_neg.json()["stock"]["quantity_on_hand"])) == Decimal("55.00")

    # 3. Prevent Negative Stock (attempting -100 kg when only 55 kg exist)
    res_adj_invalid = await async_client.post(
        f"/api/v1/admin/raw-materials/{mat_id}/adjust",
        json={
            "movement_type": "ADJUSTMENT",
            "quantity_delta": -100.0,
        },
        headers=headers,
    )
    assert res_adj_invalid.status_code == 409
    assert "would cause negative stock" in res_adj_invalid.json()["error"]["message"]


@pytest.mark.asyncio
async def test_purchase_order_lifecycle_and_material_receiving(async_client: AsyncClient, procurement_fixture):
    """4. Test creating Purchase Order and atomically receiving materials into stock."""
    headers = {"Authorization": f"Bearer {procurement_fixture['factory_token']}"}
    sup_id = str(procurement_fixture["supplier"].id)
    mat_id = str(procurement_fixture["raw_material"].id)

    # 1. Create Purchase Order (25 kg @ ₹4500)
    po_payload = {
        "supplier_id": sup_id,
        "order_date": str(date.today()),
        "items": [
            {
                "raw_material_id": mat_id,
                "quantity_ordered": 25.0,
                "unit_cost": 4500.0,
            }
        ],
        "tax_amount": 5625.0,  # 5% GST
        "notes": "Urgent yarn procurement for Deepavali batch",
    }
    res_po = await async_client.post("/api/v1/admin/purchases", json=po_payload, headers=headers)
    assert res_po.status_code == 201
    po_data = res_po.json()
    po_id = po_data["id"]
    po_number = po_data["po_number"]
    item_id = po_data["items"][0]["id"]

    assert po_data["status"] == "DRAFT"
    assert Decimal(str(po_data["subtotal_amount"])) == Decimal("112500.00")  # 25 * 4500
    assert Decimal(str(po_data["total_amount"])) == Decimal("118125.00")  # 112500 + 5625

    # 2. Receive materials (initial stock was 50 kg -> receive 25 kg -> new on hand 75 kg)
    res_rcv = await async_client.post(
        f"/api/v1/admin/purchases/{po_id}/receive",
        json={
            "items": [
                {
                    "item_id": item_id,
                    "quantity_to_receive": 25.0,
                }
            ],
            "notes": "Checked filament strength and weight. Passed QA.",
            "warehouse_location": "Yarn Bay 1 - Bin A",
        },
        headers=headers,
    )
    assert res_rcv.status_code == 200
    rcv_data = res_rcv.json()
    assert rcv_data["status"] == "RECEIVED"
    assert Decimal(str(rcv_data["items"][0]["quantity_received"])) == Decimal("25.00")

    # 3. Verify stock increased in RawMaterial
    res_mat = await async_client.get(f"/api/v1/admin/raw-materials/{mat_id}", headers=headers)
    mat_data = res_mat.json()
    assert Decimal(str(mat_data["stock"]["quantity_on_hand"])) >= Decimal("75.00")

    # 4. Verify movement ledger record
    latest_mov = mat_data["recent_movements"][0]
    assert latest_mov["movement_type"] == "PURCHASE_RECEIPT"
    assert latest_mov["reference_id"] == f"PO-{po_number}"
    assert Decimal(str(latest_mov["quantity_delta"])) == Decimal("25.00")


@pytest.mark.asyncio
async def test_production_material_consumption(async_client: AsyncClient, procurement_fixture):
    """5. Test consuming raw materials for a production batch with row locking and audit logging."""
    headers = {"Authorization": f"Bearer {procurement_fixture['factory_token']}"}
    prod_id = str(procurement_fixture["product"].id)
    mat_id = str(procurement_fixture["raw_material"].id)

    # 1. Schedule a Production Batch (10 sarees)
    batch_payload = {
        "batch_number": "PVS-BATCH-PROC-101",
        "product_id": prod_id,
        "loom_identifier": "Master Loom #4",
        "planned_quantity": 10,
        "stages": [
            {"stage_sequence": 1, "stage_name": "Silk Yarn Warping & Sizing"},
            {"stage_sequence": 2, "stage_name": "Weaving on Pit Loom"},
        ],
    }
    res_batch = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=headers)
    assert res_batch.status_code == 201
    batch_id = res_batch.json()["id"]

    # 2. Consume 6.2 kg Mulberry Silk for this batch
    consume_payload = {
        "raw_material_id": mat_id,
        "quantity_consumed": 6.2,
        "notes": "Issued warp and weft silk yarn to Loom #4",
    }
    res_consume = await async_client.post(
        f"/api/v1/admin/production/{batch_id}/consume-material",
        json=consume_payload,
        headers=headers,
    )
    assert res_consume.status_code == 201
    consumed_data = res_consume.json()
    assert Decimal(str(consumed_data["quantity_consumed"])) == Decimal("6.20")
    assert consumed_data["material_code"] == "RM-SILK-2A"

    # 3. List batch materials
    res_mat_list = await async_client.get(f"/api/v1/admin/production/{batch_id}/materials", headers=headers)
    assert res_mat_list.status_code == 200
    assert len(res_mat_list.json()) == 1

    # 4. Check Raw Material stock deducted and logged
    res_mat = await async_client.get(f"/api/v1/admin/raw-materials/{mat_id}", headers=headers)
    latest_mov = res_mat.json()["recent_movements"][0]
    assert latest_mov["movement_type"] == "PRODUCTION_CONSUMPTION"
    assert latest_mov["reference_id"] == "BATCH-PVS-BATCH-PROC-101"
    assert Decimal(str(latest_mov["quantity_delta"])) == Decimal("-6.20")

    # 5. Over-consumption exceeding stock raises 409
    res_over = await async_client.post(
        f"/api/v1/admin/production/{batch_id}/consume-material",
        json={"raw_material_id": mat_id, "quantity_consumed": 99999.0},
        headers=headers,
    )
    assert res_over.status_code == 409


@pytest.mark.asyncio
async def test_payment_management_foundation(async_client: AsyncClient, procurement_fixture):
    """6. Test recording and updating inbound customer payments and outbound supplier disbursements."""
    headers = {"Authorization": f"Bearer {procurement_fixture['sales_token']}"}
    cust_id = str(procurement_fixture["customer"].id)
    order_id = str(procurement_fixture["order"].id)
    sup_id = str(procurement_fixture["supplier"].id)

    # 1. Inbound Customer Payment against Order (Advance payment of ₹50,000 via NEFT)
    inbound_pay = {
        "payment_type": "INBOUND_CUSTOMER_PAYMENT",
        "customer_id": cust_id,
        "order_id": order_id,
        "amount": 50000.0,
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "payment_status": "RECORDED",
        "reference_transaction_id": "UTR-AXIS-20260830-99482",
        "payment_date": str(date.today()),
        "notes": "Advance payment for Deepavali wholesale consignment",
    }
    res_in = await async_client.post("/api/v1/admin/payments", json=inbound_pay, headers=headers)
    assert res_in.status_code == 201
    in_data = res_in.json()
    assert in_data["payment_type"] == "INBOUND_CUSTOMER_PAYMENT"
    assert Decimal(str(in_data["amount"])) == Decimal("50000.00")
    pay_id = in_data["id"]

    # 2. Outbound Supplier Payment (Disbursement of ₹30,000 via Cheque)
    outbound_pay = {
        "payment_type": "OUTBOUND_SUPPLIER_PAYMENT",
        "supplier_id": sup_id,
        "amount": 30000.0,
        "payment_method": "CHEQUE",
        "payment_status": "RECORDED",
        "reference_transaction_id": "CHQ-004821",
        "payment_date": str(date.today()),
        "notes": "Cheque issued for raw mulberry silk yarn delivery",
    }
    res_out = await async_client.post("/api/v1/admin/payments", json=outbound_pay, headers=headers)
    assert res_out.status_code == 201
    assert res_out.json()["payment_type"] == "OUTBOUND_SUPPLIER_PAYMENT"

    # 3. Update payment clearance status (RECORDED -> CLEARED)
    res_upd = await async_client.patch(
        f"/api/v1/admin/payments/{pay_id}",
        json={"payment_status": "CLEARED"},
        headers=headers,
    )
    assert res_upd.status_code == 200
    assert res_upd.json()["payment_status"] == "CLEARED"

    # 4. List payments
    res_list = await async_client.get("/api/v1/admin/payments", headers=headers)
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 2


@pytest.mark.asyncio
async def test_rbac_procurement_and_payments(async_client: AsyncClient, procurement_fixture):
    """7. Test RBAC permissions across Suppliers, Raw Materials, Purchasing, and Payments."""
    sup_id = str(procurement_fixture["supplier"].id)

    # 1. Sales Admin CANNOT create suppliers (403)
    sales_headers = {"Authorization": f"Bearer {procurement_fixture['sales_token']}"}
    res_sales_sup = await async_client.post(
        "/api/v1/admin/suppliers",
        json={"supplier_code": "FAIL-01", "supplier_name": "Test", "contact_person": "T", "phone": "123", "location": "TN"},
        headers=sales_headers,
    )
    assert res_sales_sup.status_code == 403

    # 2. Dealer CANNOT access procurement or payments (403)
    dealer_headers = {"Authorization": f"Bearer {procurement_fixture['dealer_token']}"}
    assert (await async_client.get("/api/v1/admin/suppliers", headers=dealer_headers)).status_code == 403
    assert (await async_client.get("/api/v1/admin/raw-materials", headers=dealer_headers)).status_code == 403
    assert (await async_client.get("/api/v1/admin/purchases", headers=dealer_headers)).status_code == 403
    assert (await async_client.get("/api/v1/admin/payments", headers=dealer_headers)).status_code == 403
