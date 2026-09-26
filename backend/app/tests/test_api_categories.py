import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus


@pytest.mark.asyncio
async def test_list_categories(async_client: AsyncClient, db_session: AsyncSession):
    """Test GET /api/v1/categories returns list of active categories."""
    c1 = Category(
        id=uuid.uuid4(),
        name="Test Pure Silk",
        slug="test-pure-silk",
        tagline="Silk mark certified",
        display_order=1,
        is_active=True,
    )
    c2 = Category(
        id=uuid.uuid4(),
        name="Test Bridal",
        slug="test-bridal",
        tagline="Wedding sarees",
        display_order=2,
        is_active=True,
    )
    c_inactive = Category(
        id=uuid.uuid4(),
        name="Inactive Category",
        slug="inactive-cat",
        is_active=False,
    )
    db_session.add_all([c1, c2, c_inactive])
    await db_session.commit()

    response = await async_client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    slugs = [cat["slug"] for cat in data]
    assert "test-pure-silk" in slugs
    assert "test-bridal" in slugs
    assert "inactive-cat" not in slugs


@pytest.mark.asyncio
async def test_get_category_products(async_client: AsyncClient, db_session: AsyncSession):
    """Test GET /api/v1/categories/{slug}/products returns paginated category products."""
    category = Category(
        id=uuid.uuid4(),
        name="Boutique Silk",
        slug="boutique-silk",
        is_active=True,
    )
    db_session.add(category)
    await db_session.flush()

    p1 = Product(
        id=uuid.uuid4(),
        code="PVS-CAT-001",
        name="Boutique Saree One",
        category_id=category.id,
        fabric="Pure Silk",
        color="Indigo",
        border="Silver",
        weave_type="Jacquard",
        description="First boutique test saree",
        is_active=True,
    )
    db_session.add(p1)
    await db_session.commit()

    response = await async_client.get("/api/v1/categories/boutique-silk/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["code"] == "PVS-CAT-001"


@pytest.mark.asyncio
async def test_category_not_found(async_client: AsyncClient):
    """Test GET /api/v1/categories/{slug}/products returns 404 for invalid slug."""
    response = await async_client.get("/api/v1/categories/non-existent-slug/products")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "HTTP_ERROR"
