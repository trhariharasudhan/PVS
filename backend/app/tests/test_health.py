import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient


def test_root_liveness_check_sync(client: TestClient):
    """Test root GET /health endpoint returns status ok (liveness)."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_api_v1_liveness_check_sync(client: TestClient):
    """Test API v1 GET /api/v1/health endpoint returns status ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_readiness_check_sync(client: TestClient):
    """Test root GET /ready endpoint returns status ok and database connected."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "password" not in response.text.lower()
    assert "postgresql" not in response.text.lower()


def test_api_v1_readiness_check_sync(client: TestClient):
    """Test API v1 GET /api/v1/ready endpoint returns status ok and database connected."""
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_root_liveness_and_readiness_async(async_client: AsyncClient):
    """Test GET /health and /ready using AsyncClient."""
    resp_live = await async_client.get("/health")
    assert resp_live.status_code == 200
    assert resp_live.json()["status"] == "ok"

    resp_ready = await async_client.get("/ready")
    assert resp_ready.status_code == 200
    assert resp_ready.json()["database"] == "connected"


@pytest.mark.asyncio
async def test_api_v1_liveness_and_readiness_async(async_client: AsyncClient):
    """Test GET /api/v1/health and /api/v1/ready using AsyncClient."""
    resp_live = await async_client.get("/api/v1/health")
    assert resp_live.status_code == 200
    assert resp_live.json()["status"] == "ok"

    resp_ready = await async_client.get("/api/v1/ready")
    assert resp_ready.status_code == 200
    assert resp_ready.json()["database"] == "connected"

