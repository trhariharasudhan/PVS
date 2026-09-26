import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.production import ProductionBatch, ProductionStage, BatchStatus, StageStatus
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def factory_fixture(db_session: AsyncSession):
    """Seed test admin accounts, category, product, and inventory."""
    super_admin = User(
        id=uuid.uuid4(),
        email="super_ops@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Operations Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory_ops@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Loom Master Raman",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales_ops@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Sales Executive Priya",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email="dealer_ops@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Showroom Partner",
        role=UserRole.DEALER,
        is_active=True,
    )

    category = Category(
        id=uuid.uuid4(),
        name="Kanchipuram Silk",
        slug="kanchipuram-silk-ops",
        display_order=1,
        is_active=True,
    )

    product = Product(
        id=uuid.uuid4(),
        code="PVS-OPS-001",
        name="Gold Brocade Wedding Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson / Gold",
        border="Temple Zari",
        weave_type="Korvai Jacquard",
        description="Authentic bridal silk saree for testing operations.",
        price=18500.00,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )

    inventory = Inventory(
        id=uuid.uuid4(),
        product_id=product.id,
        quantity_on_hand=10,
        quantity_reserved=0,
        reorder_threshold=5,
        warehouse_location="Aisle 3 - Shelf B",
    )

    db_session.add_all([super_admin, factory_mgr, sales_admin, dealer_user, category, product, inventory])
    await db_session.commit()

    return {
        "super_token": create_access_token(str(super_admin.id), super_admin.role.value),
        "factory_token": create_access_token(str(factory_mgr.id), factory_mgr.role.value),
        "sales_token": create_access_token(str(sales_admin.id), sales_admin.role.value),
        "dealer_token": create_access_token(str(dealer_user.id), dealer_user.role.value),
        "product": product,
        "inventory": inventory,
    }


@pytest.mark.asyncio
async def test_list_inventory_and_filters(async_client: AsyncClient, factory_fixture):
    """1. Test GET /api/v1/admin/inventory with pagination and search."""
    headers = {"Authorization": f"Bearer {factory_fixture['factory_token']}"}
    response = await async_client.get("/api/v1/admin/inventory?search=PVS-OPS", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    item = data["items"][0]
    assert item["product_code"] == "PVS-OPS-001"
    assert item["quantity_on_hand"] == 10
    assert item["stock_status"] == "IN_STOCK"


@pytest.mark.asyncio
async def test_inventory_positive_and_negative_adjustment(async_client: AsyncClient, factory_fixture):
    """2. Test stock adjustment creates immutable movement ledger entries."""
    headers = {"Authorization": f"Bearer {factory_fixture['sales_token']}"}
    prod_id = str(factory_fixture["product"].id)

    # 1. Positive adjustment (+15 Purchase)
    payload_pos = {
        "movement_type": "PURCHASE",
        "quantity_delta": 15,
        "notes": "Direct loom procurement batch 101",
        "reference_id": "PO-101",
    }
    res_pos = await async_client.post(
        f"/api/v1/admin/inventory/{prod_id}/adjust",
        json=payload_pos,
        headers=headers,
    )
    assert res_pos.status_code == 200
    data_pos = res_pos.json()
    assert data_pos["inventory"]["quantity_on_hand"] == 25  # 10 + 15
    assert len(data_pos["recent_movements"]) >= 1
    assert data_pos["recent_movements"][0]["movement_type"] == "PURCHASE"
    assert data_pos["recent_movements"][0]["quantity_delta"] == 15

    # 2. Negative adjustment (-3 Damage)
    payload_neg = {
        "movement_type": "DAMAGE",
        "quantity_delta": -3,
        "notes": "Water damaged in transit",
    }
    res_neg = await async_client.post(
        f"/api/v1/admin/inventory/{prod_id}/adjust",
        json=payload_neg,
        headers=headers,
    )
    assert res_neg.status_code == 200
    assert res_neg.json()["inventory"]["quantity_on_hand"] == 22  # 25 - 3


@pytest.mark.asyncio
async def test_negative_stock_prevention(async_client: AsyncClient, factory_fixture):
    """3. Test negative stock adjustment is strictly prevented (409 Conflict)."""
    headers = {"Authorization": f"Bearer {factory_fixture['sales_token']}"}
    prod_id = str(factory_fixture["product"].id)

    # Current stock is 10, attempt to reduce by -50
    payload_invalid = {
        "movement_type": "SALE",
        "quantity_delta": -50,
        "notes": "Attempting invalid negative stock",
    }
    res = await async_client.post(
        f"/api/v1/admin/inventory/{prod_id}/adjust",
        json=payload_invalid,
        headers=headers,
    )
    assert res.status_code == 409
    assert "Insufficient stock" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_inventory_movement_history(async_client: AsyncClient, factory_fixture):
    """4. Test GET /api/v1/admin/inventory/{product_id}/movements returns chronological ledger."""
    headers = {"Authorization": f"Bearer {factory_fixture['super_token']}"}
    prod_id = str(factory_fixture["product"].id)

    # Make an adjustment
    await async_client.post(
        f"/api/v1/admin/inventory/{prod_id}/adjust",
        json={"movement_type": "RETURN", "quantity_delta": 2, "notes": "Client exchange"},
        headers=headers,
    )

    # Fetch history
    res = await async_client.get(f"/api/v1/admin/inventory/{prod_id}/movements", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["items"][0]["movement_type"] == "RETURN"
    assert data["items"][0]["quantity_delta"] == 2


@pytest.mark.asyncio
async def test_production_batch_crud_and_stages(async_client: AsyncClient, factory_fixture):
    """5. Test creating production batch, listing, and advancing quality checkpoint stages."""
    headers = {"Authorization": f"Bearer {factory_fixture['factory_token']}"}
    prod_id = str(factory_fixture["product"].id)

    # 1. Create Batch
    batch_payload = {
        "batch_number": "PVS-BATCH-TEST-01",
        "product_id": prod_id,
        "loom_identifier": "Master Loom 08",
        "planned_quantity": 20,
    }
    create_res = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=headers)
    assert create_res.status_code == 201
    batch_data = create_res.json()
    batch_id = batch_data["id"]
    assert batch_data["batch_number"] == "PVS-BATCH-TEST-01"
    assert len(batch_data["stages"]) == 5  # Default checkpoints

    # 2. Advance first stage
    stage_1 = batch_data["stages"][0]
    stage_patch = {
        "status": "PASSED_QC",
        "inspected_by": "Raman Loom Master",
        "notes": "Mulberry silk count verified 20/22 denier",
    }
    stage_res = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}/stages/{stage_1['id']}",
        json=stage_patch,
        headers=headers,
    )
    assert stage_res.status_code == 200
    assert stage_res.json()["status"] == "PASSED_QC"

    # 3. Verify batch progress %
    batch_detail_res = await async_client.get(f"/api/v1/admin/production/{batch_id}", headers=headers)
    assert batch_detail_res.status_code == 200
    assert batch_detail_res.json()["progress_percent"] == 20  # 1/5 passed = 20%


@pytest.mark.asyncio
async def test_production_to_inventory_integration_and_duplicate_prevention(
    async_client: AsyncClient, factory_fixture
):
    """6. Test completing a production batch automatically increments inventory exactly once."""
    headers = {"Authorization": f"Bearer {factory_fixture['factory_token']}"}
    prod_id = str(factory_fixture["product"].id)

    # 1. Check initial inventory (seeded as 10)
    init_inv = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    initial_stock = init_inv.json()["inventory"]["quantity_on_hand"]

    # 2. Create and complete a batch of 25 sarees
    batch_payload = {
        "batch_number": "PVS-BATCH-WEAVE-99",
        "product_id": prod_id,
        "loom_identifier": "Loom 12",
        "planned_quantity": 25,
    }
    batch_res = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=headers)
    assert batch_res.status_code == 201
    batch_id = batch_res.json()["id"]

    # 3. Mark Batch as COMPLETED
    complete_res = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "completed_quantity": 25},
        headers=headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "COMPLETED"

    # 4. Verify inventory was credited by +25
    inv_after_res = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_after_res.status_code == 200
    new_stock = inv_after_res.json()["inventory"]["quantity_on_hand"]
    assert new_stock == initial_stock + 25

    # 5. Verify PRODUCTION movement ledger entry exists
    movements = inv_after_res.json()["recent_movements"]
    assert len(movements) >= 1
    assert movements[0]["movement_type"] == "PRODUCTION"
    assert movements[0]["quantity_delta"] == 25
    assert movements[0]["reference_id"] == "BATCH-PVS-BATCH-WEAVE-99"

    # 6. DUPLICATE PREVENTION: Patch again with COMPLETED and ensure stock does NOT duplicate
    complete_again_res = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED"},
        headers=headers,
    )
    assert complete_again_res.status_code == 200

    inv_duplicate_check = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=headers)
    assert inv_duplicate_check.json()["inventory"]["quantity_on_hand"] == new_stock  # Still initial + 25


@pytest.mark.asyncio
async def test_rbac_inventory_and_production(async_client: AsyncClient, factory_fixture):
    """7. Test RBAC permissions on inventory and production endpoints."""
    prod_id = str(factory_fixture["product"].id)

    # 1. Sales Admin cannot create production batch (403)
    sales_headers = {"Authorization": f"Bearer {factory_fixture['sales_token']}"}
    res_sales_prod = await async_client.post(
        "/api/v1/admin/production",
        json={"batch_number": "PVS-BLOCKED", "product_id": prod_id, "planned_quantity": 10},
        headers=sales_headers,
    )
    assert res_sales_prod.status_code == 403

    # 2. Dealer cannot access inventory (403)
    dealer_headers = {"Authorization": f"Bearer {factory_fixture['dealer_token']}"}
    res_dealer_inv = await async_client.get("/api/v1/admin/inventory", headers=dealer_headers)
    assert res_dealer_inv.status_code == 403
