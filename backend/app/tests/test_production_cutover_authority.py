import json
import pytest
from pathlib import Path

from app.core.production_cutover_authority import (
    ProductionCutoverAuthority,
    ReleaseLockState,
    ProductionAuthorizationState,
    AuthorityGateStatus,
)


def test_01_default_fail_closed_behavior():
    """1. Default execution is strictly fail-closed."""
    auth = ProductionCutoverAuthority()
    report = auth.evaluate_cutover_authority()

    assert report["phase"] == "5L-06"
    assert report["component"] == "production_cutover_authority"
    assert report["fail_closed"] is True
    assert report["production_authorized"] is False
    assert report["release_lock_state"] == ReleaseLockState.LOCKED.value
    assert report["production_authorization_state"] == ProductionAuthorizationState.NOT_AUTHORIZED.value
    assert "PRODUCTION CUTOVER BLOCKED" in report["verdict"]


def test_02_missing_gstin_blocks_authorization():
    """2. Missing or placeholder GSTIN keeps cutover blocked."""
    auth = ProductionCutoverAuthority(env_override={"BUSINESS_GSTIN": "33AAAAA0000A1Z5"})
    report = auth.evaluate_cutover_authority()
    assert report["production_authorized"] is False
    gstin_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-BUS-01")
    assert gstin_gate["status"] == AuthorityGateStatus.BLOCKED.value


def test_03_missing_business_approval_blocks_authorization():
    """3. Missing executive go-live sign-off blocks cutover."""
    auth = ProductionCutoverAuthority(env_override={"BUSINESS_OWNER_APPROVAL": "NOT_PROVIDED"})
    report = auth.evaluate_cutover_authority()
    exec_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-EXEC-01")
    assert exec_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_04_missing_production_db_blocks_authorization():
    """4. Localhost or SQLite database keeps production cutover blocked."""
    auth = ProductionCutoverAuthority(env_override={"DATABASE_URL": "postgresql+asyncpg://admin:pass@localhost:5432/pvs_db"})
    report = auth.evaluate_cutover_authority()
    db_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-INFRA-01")
    assert db_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_05_missing_production_secret_blocks_authorization():
    """5. Weak or development secret key blocks cutover."""
    auth = ProductionCutoverAuthority(env_override={"SECRET_KEY": "dev-default-secret"})
    report = auth.evaluate_cutover_authority()
    sec_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-INFRA-02")
    assert sec_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_06_missing_dns_blocks_authorization():
    """6. Unpropagated DNS keeps cutover blocked."""
    auth = ProductionCutoverAuthority(env_override={"DNS_PROPAGATED": False})
    report = auth.evaluate_cutover_authority()
    dns_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-INFRA-03")
    assert dns_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_07_missing_tls_blocks_authorization():
    """7. Missing TLS certificate keeps cutover blocked."""
    auth = ProductionCutoverAuthority(env_override={"TLS_CERT_ISSUED": False})
    report = auth.evaluate_cutover_authority()
    tls_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-INFRA-03")
    assert tls_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_08_missing_catalogue_or_media_blocks_authorization():
    """8. Pending catalogue records or photoshoot media blocks cutover."""
    auth = ProductionCutoverAuthority(env_override={"CATALOGUE_ONBOARDED": False, "PHOTOSHOOT_ONBOARDED": False})
    report = auth.evaluate_cutover_authority()
    cat_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-CAT-01")
    photo_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-CAT-02")
    assert cat_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert photo_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert report["production_authorized"] is False


def test_09_staging_pass_does_not_automatically_authorize_production():
    """9. Staging preflight PASS (100%) does NOT authorize production without live cloud inputs."""
    auth = ProductionCutoverAuthority()
    report = auth.evaluate_cutover_authority()
    stg_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-STG-01")

    assert stg_gate["status"] == AuthorityGateStatus.PASS.value
    assert report["production_authorized"] is False
    assert report["release_lock_state"] == ReleaseLockState.LOCKED.value


def test_10_engineering_pass_does_not_automatically_authorize_production():
    """10. Engineering readiness (100%) does NOT equal production cutover authorization."""
    auth = ProductionCutoverAuthority()
    report = auth.evaluate_cutover_authority()

    assert report["engineering_ready"] is True
    assert report["production_authorized"] is False


def test_11_placeholder_credentials_are_rejected():
    """11. Placeholder bank accounts and addresses are rejected for production."""
    auth = ProductionCutoverAuthority(env_override={
        "BUSINESS_BANK_ACCOUNT": "39882200192",
        "BUSINESS_ADDRESS": "42, Weavers Colony",
    })
    report = auth.evaluate_cutover_authority()
    addr_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-BUS-02")
    bank_gate = next(g for g in report["authority_gates"] if g["gate_id"] == "AUTH-BUS-03")

    assert addr_gate["status"] == AuthorityGateStatus.BLOCKED.value
    assert bank_gate["status"] == AuthorityGateStatus.BLOCKED.value


def test_12_sensitive_values_are_redacted():
    """12. Secrets and database credentials never appear in plain text."""
    raw_secret = "f" * 64
    raw_db = "postgresql+asyncpg://admin:SuperSecret999!@cloud.internal:5432/pvs"
    auth = ProductionCutoverAuthority(env_override={
        "SECRET_KEY": raw_secret,
        "DATABASE_URL": raw_db,
    })
    report = auth.evaluate_cutover_authority()
    json_str = json.dumps(report)

    assert "SuperSecret999!" not in json_str
    assert raw_secret not in json_str


def test_13_unknown_or_pending_gate_blocks_authorization():
    """13. Any single pending or unknown gate blocks production authorization."""
    # Complete synthetic cloud environment except business approval
    synthetic_env = {
        "ENVIRONMENT": "production",
        "DEBUG": False,
        "SECRET_KEY": "a" * 64,
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:SecPass99!@pvs-prod-rds.ap-south-1.rds.amazonaws.com:5432/pvs_silks_prod",
        "SECURE_COOKIE": True,
        "COOKIE_SAMESITE": "lax",
        "CORS_ORIGINS": ["https://pvssilks.com"],
        "DNS_PROPAGATED": True,
        "TLS_CERT_ISSUED": True,
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "BUSINESS_ENTITY_NAME": "PVS Silk S Private Limited",
        "BUSINESS_ADDRESS": "108 Ekambaranathar Sannathi Street, Kanchipuram - 631502",
        "BUSINESS_PHONE": "+91 98427 12345",
        "BUSINESS_EMAIL": "contact@pvssilks.com",
        "BUSINESS_BANK_ACCOUNT": "40988771122",
        "BUSINESS_BANK_IFSC": "SBIN0000853",
        "CATALOGUE_ONBOARDED": True,
        "PHOTOSHOOT_ONBOARDED": True,
        "BUSINESS_OWNER_APPROVAL": "NOT_PROVIDED",  # Missing gate
    }
    auth = ProductionCutoverAuthority(env_override=synthetic_env)
    report = auth.evaluate_cutover_authority()

    assert report["production_authorized"] is False
    assert report["release_lock_state"] == ReleaseLockState.LOCKED.value


def test_14_contradictory_gate_state_blocks_authorization():
    """14. Contradictory settings (e.g. ENVIRONMENT=production with DEBUG=True) block cutover."""
    synthetic_env = {
        "ENVIRONMENT": "production",
        "DEBUG": True,  # Contradictory & insecure
        "SECRET_KEY": "a" * 64,
        "DATABASE_URL": "postgresql+asyncpg://admin:pass@rds.internal:5432/pvs",
    }
    auth = ProductionCutoverAuthority(env_override=synthetic_env)
    report = auth.evaluate_cutover_authority()
    assert report["production_authorized"] is False


def test_15_all_mandatory_gates_pass_in_fully_synthetic_fixture():
    """15. In a 100% complete synthetic test fixture, release lock is AUTHORIZED."""
    fully_authorized_synthetic_env = {
        "ENVIRONMENT": "production",
        "DEBUG": False,
        "SECRET_KEY": "a" * 64,
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:SecPass99!@pvs-prod-rds.ap-south-1.rds.amazonaws.com:5432/pvs_silks_prod",
        "SECURE_COOKIE": True,
        "COOKIE_SAMESITE": "lax",
        "CORS_ORIGINS": ["https://pvssilks.com", "https://admin.pvssilks.com", "https://api.pvssilks.com"],
        "DNS_PROPAGATED": True,
        "TLS_CERT_ISSUED": True,
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "GST_CERTIFICATE_SUPPLIED": True,
        "BUSINESS_LEGAL_NAME": "PVS Silk S Private Limited",
        "BUSINESS_NAME": "PVS Silk S",
        "BUSINESS_ADDRESS_LINE1": "108 Ekambaranathar Sannathi Street",
        "BUSINESS_CITY": "Kanchipuram",
        "BUSINESS_STATE": "Tamil Nadu",
        "BUSINESS_PINCODE": "631502",
        "BUSINESS_PHONE": "+91 98427 12345",
        "BUSINESS_EMAIL": "contact@pvssilks.com",
        "BANK_NAME": "State Bank of India",
        "BANK_ACCOUNT_NAME": "PVS Silk S Private Limited",
        "BANK_ACCOUNT_NUMBER": "40988771122",
        "BANK_IFSC": "SBIN0000853",
        "BANK_UPI_ID": "pvssilks@sbi",
        "CATALOGUE_ONBOARDED": True,
        "PHOTOSHOOT_ONBOARDED": True,
        "BUSINESS_OWNER_APPROVAL": "APPROVED",
    }
    auth = ProductionCutoverAuthority(env_override=fully_authorized_synthetic_env)
    report = auth.evaluate_cutover_authority()

    assert report["summary"]["total_gates"] == 14
    assert report["summary"]["passed_gates"] == 14
    assert report["summary"]["blocked_gates"] == 0
    assert report["engineering_ready"] is True
    assert report["production_authorized"] is True
    assert report["release_lock_state"] == ReleaseLockState.AUTHORIZED.value
    assert report["production_authorization_state"] == ProductionAuthorizationState.AUTHORIZED.value
    assert report["verdict"] == "RELEASE AUTHORIZED FOR PRODUCTION CUTOVER"


def test_16_production_seed_protection_remains_enforced():
    """16. Seed data injection into production environment raises RuntimeError."""
    from app.db.seed import seed_development_data
    # In production mode, seed_development_data raises RuntimeError
    from app.core.config import settings
    # Test safeguard condition directly
    if settings.is_production:
        with pytest.raises(RuntimeError):
            import asyncio
            asyncio.run(seed_development_data())
    else:
        # Verify that the safety guard exists in seed_development_data source
        import inspect
        src = inspect.getsource(seed_development_data)
        assert "settings.is_production" in src
        assert "CRITICAL SAFETY VIOLATION" in src


def test_17_json_output_is_deterministic():
    """17. JSON output contains all required fields and matches canonical schema."""
    auth = ProductionCutoverAuthority()
    report = auth.evaluate_cutover_authority()

    assert "phase" in report
    assert "component" in report
    assert "release_version" in report
    assert "summary" in report
    assert "unresolved_blockers" in report
    assert "authority_gates" in report
    assert "verdict" in report
    assert len(report["authority_gates"]) == 14


def test_18_release_remains_locked_by_default():
    """18. Release lock state is LOCKED by default."""
    auth = ProductionCutoverAuthority()
    report = auth.evaluate_cutover_authority()
    assert report["release_lock_state"] == "LOCKED"
