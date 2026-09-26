import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.product import Product, ProductImage, AvailabilityStatus


@pytest.fixture
async def sample_catalogue(db_session: AsyncSession):
    """Seed sample products for catalogue testing."""
    cat_bridal = Category(id=uuid.uuid4(), name="Bridal", slug="bridal", is_active=True)
    cat_soft = Category(id=uuid.uuid4(), name="Soft Silk", slug="soft-silk", is_active=True)
    db_session.add_all([cat_bridal, cat_soft])
    await db_session.flush()

    p1 = Product(
        id=uuid.uuid4(),
        code="PVS-PROD-001",
        name="Crimson Bridal Silk Saree",
        category_id=cat_bridal.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Red",
        border="Temple Korvai",
        motif="Mayil Peacock",
        weave_type="Korvai",
        description="Heavy bridal weave",
        price=Decimal("18000.00"),
        is_price_on_enquiry=True,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_featured=True,
        is_new_arrival=True,
        is_active=True,
    )
    img1 = ProductImage(
        id=uuid.uuid4(),
        product=p1,
        image_url="https://images.unsplash.com/crimson",
        is_primary=True,
        display_order=1,
    )

    p2 = Product(
        id=uuid.uuid4(),
        code="PVS-PROD-002",
        name="Pastel Rose Soft Silk",
        category_id=cat_soft.id,
        fabric="Soft Silk",
        color="Pastel Rose",
        border="Silver Zari",
        motif="Geometric Chevron",
        weave_type="Lightweight",
        description="Airy comfortable soft silk",
        price=Decimal("11000.00"),
        is_price_on_enquiry=False,
        availability_status=AvailabilityStatus.MADE_TO_ORDER,
        is_featured=False,
        is_new_arrival=False,
        is_active=True,
    )

    db_session.add_all([p1, img1, p2])
    await db_session.commit()
    return {"cat_bridal": cat_bridal, "cat_soft": cat_soft, "p1": p1, "p2": p2}


@pytest.mark.asyncio
async def test_list_products_pagination(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products pagination metadata and items."""
    response = await async_client.get("/api/v1/products?page=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["limit"] == 1
    assert data["total_pages"] == 2
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_filter_by_category(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products with category filter."""
    response = await async_client.get("/api/v1/products?category=bridal")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["code"] == "PVS-PROD-001"


@pytest.mark.asyncio
async def test_filter_by_search(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products full-text search across name, code, fabric."""
    # Search by motif
    response = await async_client.get("/api/v1/products?search=Peacock")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["code"] == "PVS-PROD-001"

    # Search by product code
    resp_code = await async_client.get("/api/v1/products?search=PVS-PROD-002")
    assert resp_code.status_code == 200
    assert resp_code.json()["total"] == 1
    assert resp_code.json()["items"][0]["name"] == "Pastel Rose Soft Silk"


@pytest.mark.asyncio
async def test_filter_by_featured(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products?featured=true."""
    response = await async_client.get("/api/v1/products?featured=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["is_featured"] is True


@pytest.mark.asyncio
async def test_filter_by_availability(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products?availability=MADE_TO_ORDER."""
    response = await async_client.get("/api/v1/products?availability=MADE_TO_ORDER")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["code"] == "PVS-PROD-002"


@pytest.mark.asyncio
async def test_get_product_detail_by_uuid(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products/{id} with valid UUID."""
    p1 = sample_catalogue["p1"]
    response = await async_client.get(f"/api/v1/products/{p1.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "PVS-PROD-001"
    assert data["fabric"] == "Pure Mulberry Silk"
    assert len(data["images"]) == 1
    assert data["images"][0]["image_url"] == "https://images.unsplash.com/crimson"


@pytest.mark.asyncio
async def test_get_product_detail_by_code(async_client: AsyncClient, sample_catalogue):
    """Test GET /api/v1/products/{code} with product code string."""
    response = await async_client.get("/api/v1/products/PVS-PROD-001")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Crimson Bridal Silk Saree"
    assert data["category_slug"] == "bridal"


@pytest.mark.asyncio
async def test_product_not_found(async_client: AsyncClient):
    """Test GET /api/v1/products/{id_or_code} returns 404 for unknown product."""
    response = await async_client.get("/api/v1/products/PVS-UNKNOWN-999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "HTTP_ERROR"
