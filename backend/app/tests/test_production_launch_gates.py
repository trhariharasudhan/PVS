import pytest
from app.core.check_production_gates import ProductionLaunchGateChecker


def test_production_launch_gate_checker():
    checker = ProductionLaunchGateChecker()
    report = checker.run_all()

    # Verify engineering gates
    assert report["engineering_readiness_pct"] == 100.0
    assert len(report["engineering_gates"]) == 10
    for g in report["engineering_gates"]:
        assert g["status"] == "PASS"

    # Verify business gates
    assert len(report["business_gates"]) == 12
    # Verify that unfulfilled business prerequisites are correctly classified as BLOCKED
    blocked_gates = [g for g in report["business_gates"] if g["status"] == "BLOCKED"]
    assert len(blocked_gates) >= 10
    for bg in blocked_gates:
        assert "action" in bg
        assert len(bg["action"]) > 5

    # Verify overall classification
    assert report["overall_verdict"] == "STAGING READY — BUSINESS UAT PENDING"
