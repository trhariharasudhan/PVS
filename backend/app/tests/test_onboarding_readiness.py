import pytest
from app.core.verify_onboarding_readiness import OnboardingReadinessVerifier


def test_onboarding_readiness_verifier_execution():
    verifier = OnboardingReadinessVerifier()
    report = verifier.run_all()

    assert report["is_technical_ready"] is True
    assert report["technical_readiness_pct"] == 100.0
    assert report["total_gates"] == 11
    assert len(report["gates"]) == 11
    assert "ONBOARDING ENGINE TECHNICALLY READY" in report["verdict"]


def test_onboarding_individual_gates():
    verifier = OnboardingReadinessVerifier()
    g1 = verifier.verify_business_identity_gate()
    assert g1["technical_readiness"] == "PASS"

    g2 = verifier.verify_gst_identity_gate()
    assert g2["technical_readiness"] == "PASS"

    g6 = verifier.verify_master_categories_gate()
    assert g6["technical_readiness"] == "PASS"

    g7 = verifier.verify_master_products_gate()
    assert g7["technical_readiness"] == "PASS"

    g11 = verifier.verify_product_media_gate()
    assert g11["technical_readiness"] == "PASS"
