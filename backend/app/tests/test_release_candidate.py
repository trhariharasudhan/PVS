import pytest
from app.core.verify_release_candidate import ReleaseCandidateVerifier


def test_release_candidate_audits_all_pass():
    verifier = ReleaseCandidateVerifier()
    report = verifier.run_all()

    assert report["is_release_candidate_ready"] is True
    assert report["technical_readiness_pct"] == 100.0
    assert report["passed_audits"] == 7
    assert len(report["audit_items"]) == 7

    for item in report["audit_items"]:
        assert item["status"] == "PASS"
        assert len(item["details"]) > 5

    assert "RELEASE CANDIDATE TECHNICALLY CERTIFIED" in report["overall_verdict"]


def test_release_candidate_audit_items_integrity():
    verifier = ReleaseCandidateVerifier()
    env_check = verifier.audit_environment_separation()
    assert env_check["status"] == "PASS"

    mig_check = verifier.audit_migration_linear_chain()
    assert mig_check["status"] == "PASS"

    master_check = verifier.audit_master_data_dry_run()
    assert master_check["status"] == "PASS"

    dr_check = verifier.audit_disaster_recovery_compliance()
    assert dr_check["status"] == "PASS"

    sec_check = verifier.audit_security_and_observability()
    assert sec_check["status"] == "PASS"

    prod_check = verifier.audit_production_configuration_gate()
    assert prod_check["status"] == "PASS"

    bus_check = verifier.audit_business_prerequisites_status()
    assert bus_check["status"] == "PASS"
