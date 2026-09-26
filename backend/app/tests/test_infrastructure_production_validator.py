import json
import pytest
from pathlib import Path

from app.core.infrastructure_production_validator import (
    InfrastructureProductionValidator,
    InfraCheckStatus,
    mask_sensitive_val,
)


def test_validator_default_execution_is_fail_closed():
    """1. Default execution without cloud infrastructure is fail-closed (production_ready = False)."""
    val = InfrastructureProductionValidator()
    report = val.run_all()

    assert report["phase"] == "5L-04"
    assert report["component"] == "infrastructure_production_validator"
    assert report["fail_closed"] is True
    assert report["summary"]["production_ready"] is False
    assert report["summary"]["total_checks"] == 10
    assert report["summary"]["passing"] == 5
    assert report["summary"]["pending"] == 5


def test_localhost_database_rejection():
    """2. Localhost, 127.0.0.1, or SQLite database connections are marked PENDING."""
    val = InfrastructureProductionValidator(env_override={
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_db"
    })
    res = val.validate_database_cluster()
    assert res["status"] == InfraCheckStatus.PENDING.value
    assert "localhost" in res["details"].lower()


def test_invalid_database_driver_scheme_rejection():
    """3. Database URL without 'postgresql+asyncpg://' driver scheme is marked INVALID."""
    val = InfrastructureProductionValidator(env_override={
        "DATABASE_URL": "postgresql://user:pass@prod-cluster.internal:5432/pvs_db"
    })
    res = val.validate_database_cluster()
    assert res["status"] == InfraCheckStatus.INVALID.value
    assert "postgresql+asyncpg://" in res["details"]


def test_managed_production_database_acceptance():
    """4. Cloud managed database with asyncpg driver is marked PASS."""
    val = InfrastructureProductionValidator(env_override={
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:SecPass99!@pvs-prod-rds.ap-south-1.rds.amazonaws.com:5432/pvs_silks_prod"
    })
    res = val.validate_database_cluster()
    assert res["status"] == InfraCheckStatus.PASS.value


def test_development_environment_mode_rejection():
    """5. Non-production environment mode or enabled debug mode is rejected for live cutover."""
    # Development mode
    val_dev = InfrastructureProductionValidator(env_override={"ENVIRONMENT": "development"})
    assert val_dev.validate_environment_mode()["status"] == InfraCheckStatus.PENDING.value

    # Production mode with DEBUG=True
    val_debug = InfrastructureProductionValidator(env_override={"ENVIRONMENT": "production", "DEBUG": True})
    assert val_debug.validate_environment_mode()["status"] == InfraCheckStatus.INVALID.value


def test_weak_or_default_secret_key_rejection():
    """6. Default secret key or secret <64 characters is rejected."""
    # Default secret
    val_default = InfrastructureProductionValidator()
    assert val_default.validate_secret_key_entropy()["status"] == InfraCheckStatus.PENDING.value

    # Short secret
    val_short = InfrastructureProductionValidator(env_override={"SECRET_KEY": "short-secret-key-12345"})
    assert val_short.validate_secret_key_entropy()["status"] == InfraCheckStatus.INVALID.value

    # Secret containing "insecure"
    val_insecure = InfrastructureProductionValidator(env_override={"SECRET_KEY": "a" * 50 + "insecure-token-9988"})
    assert val_insecure.validate_secret_key_entropy()["status"] == InfraCheckStatus.INVALID.value


def test_valid_high_entropy_secret_acceptance():
    """7. High entropy 64-character random hex secret is marked PASS."""
    val = InfrastructureProductionValidator(env_override={"SECRET_KEY": "e" * 64})
    res = val.validate_secret_key_entropy()
    assert res["status"] == InfraCheckStatus.PASS.value


def test_insecure_cookie_rejection():
    """8. Insecure cookie or invalid SameSite policy is marked INVALID."""
    val_insecure = InfrastructureProductionValidator(env_override={"SECURE_COOKIE": False})
    assert val_insecure.validate_cookie_security()["status"] == InfraCheckStatus.INVALID.value

    val_bad_samesite = InfrastructureProductionValidator(env_override={"COOKIE_SAMESITE": "none"})
    assert val_bad_samesite.validate_cookie_security()["status"] == InfraCheckStatus.INVALID.value


def test_cors_wildcard_rejection():
    """9. Wildcard origin in CORS is rejected."""
    val = InfrastructureProductionValidator(env_override={"CORS_ORIGINS": ["*"]})
    assert val.validate_cors_configuration()["status"] == InfraCheckStatus.INVALID.value


def test_docker_non_root_runtime_invariants():
    """10. Dockerfiles verified for non-root execution (appuser:10001, nextjs:1001)."""
    val = InfrastructureProductionValidator()
    res = val.validate_docker_container_runtime()
    assert res["status"] == InfraCheckStatus.PASS.value


def test_alembic_single_head_linear_chain():
    """11. Alembic migrations verify single linear head."""
    val = InfrastructureProductionValidator()
    res = val.validate_alembic_single_head_migration()
    assert res["status"] == InfraCheckStatus.PASS.value
    assert (
        "0006_phase_6_04_communication_events" in res["details"]
        or "0005_phase_6_03_payment_webhook_events" in res["details"]
        or "0004_phase_6_01_dealer_pricing_tiers" in res["details"]
        or "0003_phase_4c_d_finance_invoicing" in res["details"]
    )





def test_sensitive_credentials_are_redacted_in_output():
    """12. Database passwords and secret keys must be masked as [REDACTED]."""
    raw_secret = "f" * 64
    raw_db = "postgresql+asyncpg://admin:TopSecretPass999!@prod.internal:5432/pvs"

    val = InfrastructureProductionValidator(env_override={
        "SECRET_KEY": raw_secret,
        "DATABASE_URL": raw_db,
    })
    report = val.run_all()
    json_str = json.dumps(report)

    assert raw_secret not in json_str
    assert "TopSecretPass999!" not in json_str
    assert "[REDACTED]" in json_str


def test_complete_valid_cloud_infrastructure_simulation():
    """13. In a fully provisioned cloud simulation, production_ready is True."""
    cloud_env = {
        "ENVIRONMENT": "production",
        "DEBUG": False,
        "SECRET_KEY": "a" * 64,
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:SecPass99!@pvs-prod-rds.ap-south-1.rds.amazonaws.com:5432/pvs_silks_prod",
        "SECURE_COOKIE": True,
        "COOKIE_SAMESITE": "lax",
        "CORS_ORIGINS": ["https://pvssilks.com", "https://admin.pvssilks.com", "https://api.pvssilks.com"],
        "DNS_PROPAGATED": True,
        "TLS_CERT_ISSUED": True,
    }
    val = InfrastructureProductionValidator(env_override=cloud_env)
    report = val.run_all()

    assert report["summary"]["total_checks"] == 10
    assert report["summary"]["passing"] == 10
    assert report["summary"]["pending"] == 0
    assert report["summary"]["invalid"] == 0
    assert report["summary"]["production_ready"] is True
    assert report["verdict"] == "INFRASTRUCTURE & ENVIRONMENT PRODUCTION READY"
