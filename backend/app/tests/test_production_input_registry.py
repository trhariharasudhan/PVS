import json
import pytest
from pathlib import Path

from app.core.production_input_registry import (
    ProductionInputRegistry,
    InputCategory,
    InputStatus,
    is_placeholder_value,
    redact_sensitive,
)


def test_registry_loads_successfully():
    """1. Registry initializes cleanly and contains 12 canonical input items."""
    reg = ProductionInputRegistry()
    report = reg.evaluate_all()

    assert report["phase"] == "5L-01"
    assert report["component"] == "production_input_registry"
    assert report["summary"]["total"] == 12
    assert len(report["items"]) == 12


def test_all_required_identifiers_are_unique():
    """2. All input IDs must be distinct and follow BUS-xx / INFRA-xx taxonomy."""
    reg = ProductionInputRegistry()
    report = reg.evaluate_all()
    ids = [item["id"] for item in report["items"]]

    assert len(ids) == len(set(ids))
    assert all(i.startswith("BUS-") or i.startswith("INFRA-") for i in ids)


def test_default_state_is_fail_closed():
    """3. Default state without external production credentials must be fail-closed (production_ready = False)."""
    reg = ProductionInputRegistry()
    report = reg.evaluate_all()

    assert report["fail_closed"] is True
    assert report["summary"]["production_ready"] is False
    assert report["summary"]["pending"] >= 8


def test_missing_or_placeholder_gstin_remains_pending():
    """4. Default placeholder GSTIN or missing GSTIN remains in PENDING status."""
    reg = ProductionInputRegistry(env_override={"BUSINESS_GSTIN": "33AAAAA0000A1Z5"})
    report = reg.evaluate_all()
    gstin_item = next(i for i in report["items"] if i["id"] == "BUS-01")

    assert gstin_item["status"] == InputStatus.PENDING.value
    assert "placeholder" in gstin_item["details"].lower()


def test_invalid_format_gstin_is_marked_invalid():
    """5. Malformed GSTIN (e.g. non-33 state code or bad length) is marked INVALID."""
    reg = ProductionInputRegistry(env_override={"BUSINESS_GSTIN": "29ABCDE1234F1Z5"})
    report = reg.evaluate_all()
    gstin_item = next(i for i in report["items"] if i["id"] == "BUS-01")

    assert gstin_item["status"] == InputStatus.INVALID.value
    assert "state code" in gstin_item["details"].lower()


def test_missing_business_address_remains_pending():
    """6. Default placeholder address remains in PENDING status."""
    reg = ProductionInputRegistry(env_override={"BUSINESS_ADDRESS_LINE1": "42, Weavers Colony"})
    report = reg.evaluate_all()
    addr_item = next(i for i in report["items"] if i["id"] == "BUS-03")

    assert addr_item["status"] == InputStatus.PENDING.value


def test_missing_banking_remains_pending():
    """7. Default placeholder bank account remains in PENDING status."""
    reg = ProductionInputRegistry(env_override={"BANK_ACCOUNT_NUMBER": "39882200192"})
    report = reg.evaluate_all()
    bank_item = next(i for i in report["items"] if i["id"] == "BUS-04")

    assert bank_item["status"] == InputStatus.PENDING.value


def test_missing_catalogue_and_photos_remain_pending():
    """8. Unimported catalogue and photos remain in PENDING status."""
    reg = ProductionInputRegistry(env_override={"CATALOGUE_ONBOARDED": False, "PHOTOSHOOT_ONBOARDED": False})
    report = reg.evaluate_all()
    cat_item = next(i for i in report["items"] if i["id"] == "BUS-06")
    photo_item = next(i for i in report["items"] if i["id"] == "BUS-07")

    assert cat_item["status"] == InputStatus.PENDING.value
    assert photo_item["status"] == InputStatus.PENDING.value


def test_missing_production_infrastructure_remains_pending():
    """9. Localhost DB, weak secret, unpropagated DNS, and missing TLS remain PENDING."""
    reg = ProductionInputRegistry()
    report = reg.evaluate_all()

    for infra_id in ["INFRA-01", "INFRA-02", "INFRA-03", "INFRA-04"]:
        item = next(i for i in report["items"] if i["id"] == infra_id)
        assert item["status"] == InputStatus.PENDING.value


def test_obvious_placeholder_values_rejected_by_helper():
    """10. Placeholder detection correctly identifies demo/test strings."""
    assert is_placeholder_value("localhost") is True
    assert is_placeholder_value("127.0.0.1") is True
    assert is_placeholder_value("user@example.com") is True
    assert is_placeholder_value("dummy-password") is True
    assert is_placeholder_value("pvs-insecure-secret") is True
    assert is_placeholder_value("142 Mettu Street, Kanchipuram") is False


def test_localhost_production_database_is_rejected():
    """11. Localhost or SQLite database connection is rejected."""
    reg = ProductionInputRegistry(env_override={"DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_db"})
    db_item = reg.evaluate_infra_01_postgresql()

    assert db_item["status"] == InputStatus.PENDING.value
    assert "localhost" in db_item["details"].lower()


def test_weak_or_insecure_secret_is_rejected():
    """12. Secret containing 'insecure' or under 64 characters is rejected as INVALID/PENDING."""
    reg_default = ProductionInputRegistry()
    item_default = reg_default.evaluate_infra_02_secret()
    assert item_default["status"] == InputStatus.PENDING.value

    reg_short = ProductionInputRegistry(env_override={"SECRET_KEY": "short-secret"})
    item_short = reg_short.evaluate_infra_02_secret()
    assert item_short["status"] == InputStatus.INVALID.value

    reg_insecure = ProductionInputRegistry(env_override={"SECRET_KEY": "a" * 50 + "insecure-key-default-change-9988"})
    item_insecure = reg_insecure.evaluate_infra_02_secret()
    assert item_insecure["status"] == InputStatus.INVALID.value


def test_sensitive_values_are_redacted_from_output():
    """13. Bank accounts, database URLs, and secret keys must be redacted in JSON / CLI."""
    raw_secret = "b" * 64
    raw_bank = "498877112233"
    raw_db = "postgresql+asyncpg://admin:super_secret_pw@prod-db.internal:5432/pvs"

    reg = ProductionInputRegistry(env_override={
        "SECRET_KEY": raw_secret,
        "BANK_ACCOUNT_NUMBER": raw_bank,
        "DATABASE_URL": raw_db,
    })
    report = reg.evaluate_all()
    json_str = json.dumps(report)

    assert raw_secret not in json_str
    assert raw_bank not in json_str
    assert "super_secret_pw" not in json_str
    assert "[REDACTED]" in json_str


def test_json_output_is_deterministic_and_structured():
    """14. JSON output follows strict Phase 5L-01 schema contract."""
    reg = ProductionInputRegistry()
    report = reg.evaluate_all()

    assert "phase" in report
    assert "component" in report
    assert "fail_closed" in report
    assert "summary" in report
    assert "items" in report

    summary = report["summary"]
    for k in ["total", "valid", "pending", "invalid", "blocked", "production_ready"]:
        assert k in summary


def test_dry_run_does_not_mutate_state():
    """15. Dry-run evaluation does not modify environment or database."""
    reg = ProductionInputRegistry()
    report1 = reg.evaluate_all()
    report2 = reg.evaluate_all()

    assert report1["summary"] == report2["summary"]


def test_simulation_all_valid_satisfies_readiness():
    """16. In a controlled test simulation with 100% valid inputs, production_ready is True."""
    complete_valid_env = {
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "BUSINESS_LEGAL_NAME": "PVS Silk S Private Limited",
        "BUSINESS_ADDRESS_LINE1": "142 Mettu Street",
        "BUSINESS_CITY": "Kanchipuram",
        "BUSINESS_PINCODE": "631501",
        "BANK_ACCOUNT_NUMBER": "40991122334",
        "BANK_IFSC": "SBIN0000853",
        "BANK_NAME": "State Bank of India",
        "BUSINESS_PHONE": "+91 98427 12345",
        "BUSINESS_EMAIL": "contact@pvssilks.com",
        "CATALOGUE_ONBOARDED": True,
        "PHOTOSHOOT_ONBOARDED": True,
        "BUSINESS_OWNER_APPROVAL": "APPROVED",
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:SecPass99!@db.pvssilks.internal:5432/pvs_prod",
        "SECRET_KEY": "d" * 64,
        "DNS_PROPAGATED": True,
        "TLS_CERT_ISSUED": True,
    }
    reg = ProductionInputRegistry(env_override=complete_valid_env)
    report = reg.evaluate_all()

    assert report["summary"]["total"] == 12
    assert report["summary"]["valid"] == 12
    assert report["summary"]["pending"] == 0
    assert report["summary"]["production_ready"] is True
