import pytest
import uuid
from httpx import AsyncClient
from app.core.logging_config import redact_sensitive_data, get_correlation_id, correlation_id_ctx
from app.core.audit import log_audit_event


@pytest.mark.asyncio
async def test_correlation_id_middleware_propagation(async_client: AsyncClient):
    custom_cid = str(uuid.uuid4())
    res = await async_client.get("/health", headers={"X-Correlation-ID": custom_cid})
    assert res.status_code == 200
    assert res.headers.get("x-correlation-id") == custom_cid
    assert res.headers.get("x-request-id") == custom_cid


@pytest.mark.asyncio
async def test_auto_generated_correlation_id(async_client: AsyncClient):
    res = await async_client.get("/health")
    assert res.status_code == 200
    assert "x-correlation-id" in res.headers
    assert len(res.headers["x-correlation-id"]) > 10


@pytest.mark.asyncio
async def test_error_response_contains_correlation_id(async_client: AsyncClient):
    res = await async_client.get("/api/v1/products/NON-EXISTENT-CODE-9999")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert "correlation_id" in data["error"]
    assert data["error"]["correlation_id"] == res.headers.get("x-correlation-id")


def test_sensitive_credential_redaction():
    sample_payload = {
        "user_email": "admin@pvssilks.com",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
        "metadata": {
            "secret_key": "raw-hex-crypto-secret",
            "nested_list": [
                {"client_secret": "sensitive-oauth-secret", "public_id": "PVS-01"}
            ]
        }
    }
    redacted = redact_sensitive_data(sample_payload)
    assert redacted["user_email"] == "admin@pvssilks.com"
    assert redacted["password"] == "[REDACTED]"
    assert redacted["access_token"] == "[REDACTED]"
    assert redacted["metadata"]["secret_key"] == "[REDACTED]"
    assert redacted["metadata"]["nested_list"][0]["client_secret"] == "[REDACTED]"
    assert redacted["metadata"]["nested_list"][0]["public_id"] == "PVS-01"


def test_audit_event_logging_structure():
    event = log_audit_event(
        event_type="AUTH",
        action="LOGIN_FAILURE",
        status="FAILURE",
        user_id="anonymous",
        details={"attempted_email": "intruder@hack.com", "password": "hacked-attempt"},
    )
    assert event["event_type"] == "AUTH"
    assert event["action"] == "LOGIN_FAILURE"
    assert event["status"] == "FAILURE"
    assert event["details"]["password"] == "[REDACTED]"
    assert event["details"]["attempted_email"] == "intruder@hack.com"
    assert "correlation_id" in event
    assert "timestamp" in event
