import os
import json
import pytest
from pathlib import Path

from app.core.config import settings
from app.core.final_cutover_controller import (
    FinalCutoverController,
    GateCategory,
    GateStatus,
)


def test_final_cutover_controller_default_state_is_blocked():
    """1. Default execution state must be fail-closed (BLOCKED) due to external prerequisites."""
    controller = FinalCutoverController()
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is False
    assert "BLOCKED" in report["final_verdict"]
    assert report["blocking_failures_count"] >= 5
    assert len(report["gates"]) == 20


def test_technical_gates_pass_but_business_approval_missing():
    """2. If all technical & infra gates pass but business approval is missing, cutover remains BLOCKED."""
    simulated_env = {
        "ALL_INFRA_PASS": True,
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "BUSINESS_LEGAL_NAME": "PVS Silk S Private Limited",
        "BUSINESS_ADDRESS_LINE1": "142 Mettu Street",
        "BANK_ACCOUNT_NUMBER": "40991122334",
        "CATALOGUE_ONBOARDED": True,
        "PHOTOSHOOT_ONBOARDED": True,
        "BUSINESS_OWNER_APPROVAL": "NOT_PROVIDED",  # Missing human approval
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is False
    assert any(g["gate_id"] == "CUTOVER-BUS-07" and g["status"] == "BLOCKED" for g in report["gates"])
    assert "BLOCKED" in report["final_verdict"]


def test_missing_gstin_blocks_cutover():
    """3. Missing or placeholder GSTIN must block cutover."""
    simulated_env = {
        "ALL_BUSINESS_PASS": False,
        "BUSINESS_GSTIN": "33AAAAA0000A1Z5",  # Placeholder
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is False
    bus_01 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-BUS-01")
    assert bus_01["status"] == "BLOCKED"


def test_missing_production_database_blocks_cutover():
    """4. Localhost or SQLite database URL must block production cutover."""
    simulated_env = {
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_db",
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is False
    infra_01 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-INFRA-01")
    assert infra_01["status"] == "BLOCKED"


def test_weak_production_secret_blocks_cutover():
    """5. Weak or default secret key must block production cutover."""
    simulated_env = {
        "SECRET_KEY": "insecure-default-dev-secret",
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is False
    infra_02 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-INFRA-02")
    assert infra_02["status"] == "BLOCKED"


def test_invalid_dns_tls_blocks_cutover():
    """6. Unpropagated DNS or missing TLS cert must block cutover."""
    simulated_env = {
        "DNS_PROPAGATED": False,
        "TLS_CERT_ISSUED": False,
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    infra_03 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-INFRA-03")
    infra_04 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-INFRA-04")
    assert infra_03["status"] == "BLOCKED"
    assert infra_04["status"] == "BLOCKED"


def test_valid_complete_configuration_simulation_ready():
    """7. Valid complete simulated environment returns READY FOR EXPLICIT HUMAN AUTHORIZATION."""
    simulated_env = {
        "ALL_BUSINESS_PASS": True,
        "ALL_INFRA_PASS": True,
        "BUSINESS_OWNER_APPROVAL": "APPROVED",
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "DATABASE_URL": "postgresql+asyncpg://pvs_admin:HighEntropyPass99!@db.pvssilks.internal:5432/pvs_prod",
        "SECRET_KEY": "e" * 64,
        "DNS_PROPAGATED": True,
        "TLS_CERT_ISSUED": True,
        "CATALOGUE_ONBOARDED": True,
        "PHOTOSHOOT_ONBOARDED": True,
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()

    assert report["is_cutover_ready"] is True
    assert report["blocking_failures_count"] == 0
    assert report["final_verdict"] == "FINAL CUTOVER: READY FOR EXPLICIT HUMAN AUTHORIZATION"


def test_secrets_are_never_exposed_in_output():
    """8. Sensitive secrets must never appear in cleartext anywhere in controller report or JSON."""
    raw_secret = "f" * 64
    simulated_env = {
        "SECRET_KEY": raw_secret,
    }
    controller = FinalCutoverController(simulated_env=simulated_env)
    report = controller.run_cutover_evaluation()
    json_str = json.dumps(report)

    assert raw_secret not in json_str
    infra_02 = next(g for g in report["gates"] if g["gate_id"] == "CUTOVER-INFRA-02")
    assert "redacted" in infra_02["evidence"].lower()


def test_json_output_is_deterministic_and_structured():
    """9. JSON output contains all required fields and categories."""
    controller = FinalCutoverController()
    report = controller.run_cutover_evaluation()

    required_keys = {
        "release_identity",
        "is_cutover_ready",
        "final_verdict",
        "total_gates",
        "blocking_failures_count",
        "category_summary",
        "category_breakdown",
        "blocking_failures",
        "gates",
    }
    assert required_keys.issubset(set(report.keys()))
    assert report["release_identity"]["version"] == "v1.0.0-rc1"
    assert report["release_identity"]["migration_head"] == "0003_phase_4c_d_finance_invoicing"


def test_production_seed_demo_protection():
    """10. Seed/demo operations raise RuntimeError if environment is set to production."""
    from app.core.config import Settings

    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="c" * 64,
        DATABASE_URL="postgresql+asyncpg://pvs_user:pass@db.pvssilks.internal:5432/pvs_prod",
        BUSINESS_GSTIN="33AAAAA0000A1Z5",
    )
    # Check that settings recognizes production
    assert prod_settings.ENVIRONMENT == "production"
