import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def admin_fixture(db_session: AsyncSession):
    """Seed test admin accounts and initial categories."""
    super_admin = User(
        id=uuid.uuid4(),
        email="super@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Sales Admin",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Factory Manager",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    cat_bridal = Category(
        id=uuid.uuid4(),
        name="Bridal Admin Cat",
        slug="bridal-admin-cat",
        tagline="Wedding Silk",
        display_order=1,
        is_active=True,
    )
    db_session.add_all([super_admin, sales_admin, factory_mgr, cat_bridal])
    await db_session.commit()

    super_token = create_access_token(str(super_admin.id), super_admin.role.value)
    sales_token = create_access_token(str(sales_admin.id), sales_admin.role.value)
    factory_token = create_access_token(str(factory_mgr.id), factory_mgr.role.value)

    return {
        "super_token": super_token,
        "sales_token": sales_token,
        "factory_token": factory_token,
        "cat_bridal": cat_bridal,
    }


@pytest.mark.asyncio
async def test_admin_dashboard_metrics(async_client: AsyncClient, admin_fixture):
    """1. Test GET /api/v1/admin/dashboard calculates live database metrics."""
    headers = {"Authorization": f"Bearer {admin_fixture['super_token']}"}
    response = await async_client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_active_products" in data
    assert "total_categories" in data
    assert data["total_categories"] >= 1


@pytest.mark.asyncio
async def test_admin_dashboard_unauthenticated(async_client: AsyncClient):
    """2. Test GET /api/v1/admin/dashboard rejects unauthenticated access with 401."""
    response = await async_client.get("/api/v1/admin/dashboard")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_product_crud_lifecycle(async_client: AsyncClient, admin_fixture):
    """3. Test complete product creation, update, deactivation and public catalog reflection."""
    headers = {"Authorization": f"Bearer {admin_fixture['sales_token']}"}
    cat_id = str(admin_fixture["cat_bridal"].id)

    # 1. Create Product
    create_payload = {
        "code": "PVS-ADM-001",
        "name": "Admin Saree Test Model",
        "category_id": cat_id,
        "fabric": "Pure Mulberry Silk",
        "color": "Royal Crimson",
        "border": "Korvai Temple Border",
        "pallu": "Brocade Floral Pallu",
        "motif": "Peacock",
        "weave_type": "Korvai Jacquard",
        "description": "Admin test saree description",
        "price": 16500.00,
        "is_price_on_enquiry": True,
        "availability_status": "IN_STOCK",
        "is_featured": True,
        "is_active": True,
        "images": [
            {
                "image_url": "https://images.unsplash.com/photo-admin-1",
                "alt_text": "Full View",
                "tag": "Full Saree",
                "is_primary": True,
            }
        ],
    }

    create_res = await async_client.post("/api/v1/admin/products", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    prod_data = create_res.json()
    prod_id = prod_data["id"]
    assert prod_data["code"] == "PVS-ADM-001"
    assert len(prod_data["images"]) == 1

    # 2. Verify Product appears in Public API catalogue
    public_res = await async_client.get("/api/v1/products?search=PVS-ADM-001")
    assert public_res.status_code == 200
    assert public_res.json()["total"] == 1
    assert public_res.json()["items"][0]["name"] == "Admin Saree Test Model"

    # 3. Partial Update Product
    update_payload = {
        "name": "Updated Admin Saree Model",
        "price": 17500.00,
        "availability_status": "MADE_TO_ORDER",
    }
    patch_res = await async_client.patch(f"/api/v1/admin/products/{prod_id}", json=update_payload, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Admin Saree Model"
    assert patch_res.json()["availability_status"] == "MADE_TO_ORDER"

    # 4. Soft-Deactivate Product
    del_res = await async_client.delete(f"/api/v1/admin/products/{prod_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] is False

    # 5. Verify Deactivated Product is removed from public catalogue
    public_after_del = await async_client.get("/api/v1/products?search=PVS-ADM-001")
    assert public_after_del.status_code == 200
    assert public_after_del.json()["total"] == 0  # Inactive item does not show publicly


@pytest.mark.asyncio
async def test_admin_duplicate_product_code_conflict(async_client: AsyncClient, admin_fixture):
    """4. Test creating duplicate product code returns 409 Conflict."""
    headers = {"Authorization": f"Bearer {admin_fixture['sales_token']}"}
    cat_id = str(admin_fixture["cat_bridal"].id)

    payload = {
        "code": "PVS-UNIQUE-SKU",
        "name": "Saree One",
        "category_id": cat_id,
        "fabric": "Silk",
        "color": "Red",
        "border": "Zari",
        "description": "First",
    }

    res1 = await async_client.post("/api/v1/admin/products", json=payload, headers=headers)
    assert res1.status_code == 201

    res2 = await async_client.post("/api/v1/admin/products", json=payload, headers=headers)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["error"]["message"]


@pytest.mark.asyncio
async def test_admin_product_rbac_permissions(async_client: AsyncClient, admin_fixture):
    """5. Test Factory Manager cannot create products (403 Forbidden)."""
    headers = {"Authorization": f"Bearer {admin_fixture['factory_token']}"}
    cat_id = str(admin_fixture["cat_bridal"].id)

    payload = {
        "code": "PVS-FACTORY-TEST",
        "name": "Factory Created Saree",
        "category_id": cat_id,
        "fabric": "Silk",
        "color": "Green",
        "border": "Zari",
        "description": "Factory attempt description",
    }

    res = await async_client.post("/api/v1/admin/products", json=payload, headers=headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_admin_product_image_crud(async_client: AsyncClient, admin_fixture):
    """6. Test adding, updating, and deleting photography angles."""
    headers = {"Authorization": f"Bearer {admin_fixture['sales_token']}"}
    cat_id = str(admin_fixture["cat_bridal"].id)

    # Create base product
    prod_res = await async_client.post(
        "/api/v1/admin/products",
        json={
            "code": "PVS-IMG-TEST",
            "name": "Image Test Saree",
            "category_id": cat_id,
            "fabric": "Pure Silk",
            "color": "Blue",
            "border": "Silver Zari",
            "description": "Valid test saree description",
        },
        headers=headers,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 1. Add Image
    img_res = await async_client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={"image_url": "https://images.unsplash.com/new-angle", "tag": "Border Detail", "is_primary": True},
        headers=headers,
    )
    assert img_res.status_code == 201
    img_data = img_res.json()
    img_id = img_data["id"]
    assert img_data["is_primary"] is True

    # 2. Update Image
    patch_img = await async_client.patch(
        f"/api/v1/admin/products/{prod_id}/images/{img_id}",
        json={"alt_text": "Updated Alt Text", "display_order": 2},
        headers=headers,
    )
    assert patch_img.status_code == 200
    assert patch_img.json()["alt_text"] == "Updated Alt Text"

    # 3. Delete Image
    del_img = await async_client.delete(
        f"/api/v1/admin/products/{prod_id}/images/{img_id}",
        headers=headers,
    )
    assert del_img.status_code == 204


@pytest.mark.asyncio
async def test_admin_category_crud(async_client: AsyncClient, admin_fixture):
    """7. Test Category creation, update, and soft-deactivation."""
    headers = {"Authorization": f"Bearer {admin_fixture['sales_token']}"}

    # 1. Create Category
    create_cat = await async_client.post(
        "/api/v1/admin/categories",
        json={"name": "Kora Silk Admin", "slug": "kora-silk-admin", "tagline": "Handwoven Kora", "display_order": 10},
        headers=headers,
    )
    assert create_cat.status_code == 201
    cat_data = create_cat.json()
    cat_id = cat_data["id"]
    assert cat_data["slug"] == "kora-silk-admin"

    # 2. Duplicate Slug returns 409
    dup_res = await async_client.post(
        "/api/v1/admin/categories",
        json={"name": "Kora Duplicate", "slug": "kora-silk-admin"},
        headers=headers,
    )
    assert dup_res.status_code == 409

    # 3. Update Category
    patch_cat = await async_client.patch(
        f"/api/v1/admin/categories/{cat_id}",
        json={"name": "Updated Kora Silk"},
        headers=headers,
    )
    assert patch_cat.status_code == 200
    assert patch_cat.json()["name"] == "Updated Kora Silk"

    # 4. Soft-Deactivate Category
    deact_cat = await async_client.delete(
        f"/api/v1/admin/categories/{cat_id}",
        headers=headers,
    )
    assert deact_cat.status_code == 200
    assert deact_cat.json()["is_active"] is False
