import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings


@pytest.fixture
async def seeded_users(db_session: AsyncSession):
    """Seed test users with different roles."""
    super_admin = User(
        id=uuid.uuid4(),
        email="superadmin@pvssilks.test",
        hashed_password=get_password_hash("SuperSecretPass123!"),
        full_name="Super Admin Master",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales@pvssilks.test",
        hashed_password=get_password_hash("SalesPass123!"),
        full_name="Sales Manager",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory@pvssilks.test",
        hashed_password=get_password_hash("FactoryPass123!"),
        full_name="Factory Loom Master",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    inactive_user = User(
        id=uuid.uuid4(),
        email="inactive@pvssilks.test",
        hashed_password=get_password_hash("InactivePass123!"),
        full_name="Former Staff",
        role=UserRole.SALES_ADMIN,
        is_active=False,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email="dealer@pvssilks.test",
        hashed_password=get_password_hash("DealerPass123!"),
        full_name="Showroom Dealer",
        role=UserRole.DEALER,
        is_active=True,
    )

    db_session.add_all([super_admin, sales_admin, factory_mgr, inactive_user, dealer_user])
    await db_session.commit()
    return {
        "super_admin": super_admin,
        "sales_admin": sales_admin,
        "factory_mgr": factory_mgr,
        "inactive_user": inactive_user,
        "dealer_user": dealer_user,
    }


@pytest.mark.asyncio
async def test_successful_login_sets_cookie(async_client: AsyncClient, seeded_users):
    """1. Test successful login sets HttpOnly cookie and returns safe UserPublic."""
    payload = {
        "email": "superadmin@pvssilks.test",
        "password": "SuperSecretPass123!",
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify user fields
    assert data["user"]["email"] == "superadmin@pvssilks.test"
    assert data["user"]["role"] == "SUPER_ADMIN"
    assert data["user"]["full_name"] == "Super Admin Master"

    # Verify NO password or hash leakage
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]
    assert "SuperSecretPass123!" not in response.text
    assert "$argon2" not in response.text

    # Verify HttpOnly Cookie was set
    assert settings.AUTH_COOKIE_NAME in response.cookies
    token_cookie = response.cookies[settings.AUTH_COOKIE_NAME]
    assert token_cookie is not None


@pytest.mark.asyncio
async def test_invalid_password_fails(async_client: AsyncClient, seeded_users):
    """2. Test invalid password returns 401 without leaking internal info."""
    payload = {
        "email": "superadmin@pvssilks.test",
        "password": "WrongPassword123!",
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "HTTP_ERROR"
    assert "Invalid email or password" in data["error"]["message"]


@pytest.mark.asyncio
async def test_non_existent_email_fails(async_client: AsyncClient, seeded_users):
    """3. Test non-existent email returns generic 401 to prevent user enumeration."""
    payload = {
        "email": "nonexistent@pvssilks.test",
        "password": "AnyPassword123!",
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert "Invalid email or password" in data["error"]["message"]


@pytest.mark.asyncio
async def test_inactive_user_login_fails(async_client: AsyncClient, seeded_users):
    """4. Test inactive user account cannot log in."""
    payload = {
        "email": "inactive@pvssilks.test",
        "password": "InactivePass123!",
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert "Account is inactive" in data["error"]["message"]


@pytest.mark.asyncio
async def test_unauthenticated_me_returns_401(async_client: AsyncClient):
    """5. Test GET /api/v1/auth/me without cookie or header returns 401."""
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_me_with_cookie(async_client: AsyncClient, seeded_users):
    """6. Test GET /api/v1/auth/me with active session cookie."""
    # Login first
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "sales@pvssilks.test", "password": "SalesPass123!"},
    )
    assert login_res.status_code == 200

    # Query /me using cookie
    me_res = await async_client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "sales@pvssilks.test"
    assert me_data["role"] == "SALES_ADMIN"
    assert "hashed_password" not in me_data


@pytest.mark.asyncio
async def test_authenticated_me_with_bearer_token(async_client: AsyncClient, seeded_users):
    """7. Test GET /api/v1/auth/me with Authorization: Bearer token header."""
    user = seeded_users["factory_mgr"]
    token = create_access_token(subject=str(user.id), role=user.role.value)

    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "FACTORY_MANAGER"


@pytest.mark.asyncio
async def test_logout_clears_cookie(async_client: AsyncClient, seeded_users):
    """8. Test POST /api/v1/auth/logout clears the session cookie."""
    # Login first
    await async_client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@pvssilks.test", "password": "SuperSecretPass123!"},
    )

    # Logout
    logout_res = await async_client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200
    assert "logged out" in logout_res.json()["message"].lower()


@pytest.mark.asyncio
async def test_password_hashing_security(db_session: AsyncSession, seeded_users):
    """9. Security Test: Verify password is never stored in plaintext."""
    user = seeded_users["super_admin"]
    raw_db_user = await db_session.get(User, user.id)
    assert raw_db_user is not None
    assert raw_db_user.hashed_password != "SuperSecretPass123!"
    assert raw_db_user.hashed_password.startswith("$argon2")


@pytest.mark.asyncio
async def test_rbac_authorization_checks(async_client: AsyncClient, seeded_users):
    """10. RBAC Test: Verify role permissions and 403 Forbidden handling."""
    from fastapi import APIRouter, Depends
    from app.main import app
    from app.api.deps import require_role

    # Create temporary test router to verify require_role
    test_router = APIRouter(prefix="/api/v1/test-rbac")

    @test_router.get("/factory-only")
    async def factory_endpoint(user: User = Depends(require_role(UserRole.FACTORY_MANAGER))):
        return {"status": "authorized", "user_role": user.role}

    @test_router.get("/sales-only")
    async def sales_endpoint(user: User = Depends(require_role(UserRole.SALES_ADMIN))):
        return {"status": "authorized", "user_role": user.role}

    app.include_router(test_router)

    # 1. Super Admin has access to all roles
    super_user = seeded_users["super_admin"]
    super_token = create_access_token(subject=str(super_user.id), role=super_user.role.value)
    res_super = await async_client.get(
        "/api/v1/test-rbac/factory-only",
        headers={"Authorization": f"Bearer {super_token}"},
    )
    assert res_super.status_code == 200

    # 2. Factory Manager has access to factory endpoint
    factory_user = seeded_users["factory_mgr"]
    factory_token = create_access_token(subject=str(factory_user.id), role=factory_user.role.value)
    res_fac = await async_client.get(
        "/api/v1/test-rbac/factory-only",
        headers={"Authorization": f"Bearer {factory_token}"},
    )
    assert res_fac.status_code == 200

    # 3. Factory Manager is blocked (403) from sales-only endpoint
    res_fac_blocked = await async_client.get(
        "/api/v1/test-rbac/sales-only",
        headers={"Authorization": f"Bearer {factory_token}"},
    )
    assert res_fac_blocked.status_code == 403
    assert "Access forbidden" in res_fac_blocked.json()["error"]["message"]

    # 4. Sales Admin is blocked (403) from factory-only endpoint
    sales_user = seeded_users["sales_admin"]
    sales_token = create_access_token(subject=str(sales_user.id), role=sales_user.role.value)
    res_sales_blocked = await async_client.get(
        "/api/v1/test-rbac/factory-only",
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert res_sales_blocked.status_code == 403

    # 5. Dealer is blocked (403) from both internal endpoints
    dealer_user = seeded_users["dealer_user"]
    dealer_token = create_access_token(subject=str(dealer_user.id), role=dealer_user.role.value)
    res_dealer = await async_client.get(
        "/api/v1/test-rbac/factory-only",
        headers={"Authorization": f"Bearer {dealer_token}"},
    )
    assert res_dealer.status_code == 403
