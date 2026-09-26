import json
import pytest
from pathlib import Path

from app.core.business_identity_validator import (
    BusinessIdentityValidator,
    ValidationStatus,
    is_placeholder,
    mask_sensitive,
)


def test_validator_default_execution_is_fail_closed():
    """1. Default execution without external business data is fail-closed (production_ready = False)."""
    val = BusinessIdentityValidator()
    report = val.run_all()

    assert report["phase"] == "5L-02"
    assert report["component"] == "business_identity_validator"
    assert report["fail_closed"] is True
    assert report["summary"]["production_ready"] is False
    assert report["summary"]["total_checks"] == 6


def test_missing_or_placeholder_gstin_remains_pending():
    """2. Default placeholder GSTIN or empty string results in PENDING and UNVERIFIED."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_GSTIN": "33AAAAA0000A1Z5"})
    res = val.validate_gstin()

    assert res["status"] == ValidationStatus.PENDING.value
    assert res["verification_level"] == "UNVERIFIED"
    assert "placeholder" in res["details"].lower()


def test_invalid_gstin_length_is_invalid():
    """3. GSTIN with length != 15 is marked INVALID."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_GSTIN": "33ABCDE1234F1Z"})
    res = val.validate_gstin()

    assert res["status"] == ValidationStatus.INVALID.value
    assert "15 characters" in res["details"]


def test_invalid_gstin_character_structure_is_invalid():
    """4. GSTIN with malformed alphanumeric pattern is marked INVALID."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_GSTIN": "331234567890123"})
    res = val.validate_gstin()

    assert res["status"] == ValidationStatus.INVALID.value
    assert "alphanumeric character structure" in res["details"]


def test_invalid_state_code_prefix_is_invalid():
    """5. GSTIN with non-existent Indian state code is marked INVALID."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_GSTIN": "00ABCDE1234F1Z5"})
    res = val.validate_gstin()

    assert res["status"] == ValidationStatus.INVALID.value
    assert "state code" in res["details"].lower()


def test_non_tamil_nadu_state_code_is_invalid_for_pvs():
    """6. GSTIN with non-TN state code (e.g. 29 for Karnataka) is rejected for TN showroom."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_GSTIN": "29ABCDE1234F1Z5"})
    res = val.validate_gstin()

    assert res["status"] == ValidationStatus.INVALID.value
    assert "Tamil Nadu" in res["details"]


def test_valid_gstin_distinguishes_format_from_government_verification():
    """7. Valid format without certificate is FORMAT_VALID / REGISTRATION_UNVERIFIED; with cert is VALID."""
    # A. Format valid only (certificate not supplied)
    val_unverified = BusinessIdentityValidator(env_override={
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "GST_CERTIFICATE_SUPPLIED": False,
    })
    res_unverified = val_unverified.validate_gstin()
    assert res_unverified["status"] == ValidationStatus.FORMAT_VALID.value
    assert res_unverified["verification_level"] == "REGISTRATION_UNVERIFIED"

    # B. Certificate supplied and verified
    val_verified = BusinessIdentityValidator(env_override={
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "GST_CERTIFICATE_SUPPLIED": True,
    })
    res_verified = val_verified.validate_gstin()
    assert res_verified["status"] == ValidationStatus.VALID.value
    assert res_verified["verification_level"] == "GOVERNMENT_REGISTRATION_VERIFIED"


def test_missing_or_placeholder_legal_entity_remains_pending():
    """8. Missing or placeholder legal entity name is PENDING."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_LEGAL_NAME": ""})
    res = val.validate_legal_entity()

    assert res["status"] == ValidationStatus.PENDING.value


def test_missing_or_placeholder_showroom_address_remains_pending():
    """9. Default placeholder showroom address is PENDING."""
    val = BusinessIdentityValidator(env_override={"BUSINESS_ADDRESS_LINE1": "42, Weavers Colony"})
    res = val.validate_registered_address()

    assert res["status"] == ValidationStatus.PENDING.value


def test_invalid_pincode_format_is_rejected():
    """10. Malformed or non-Tamil Nadu PIN codes are marked INVALID."""
    # 5 digits
    val_short = BusinessIdentityValidator(env_override={
        "BUSINESS_ADDRESS_LINE1": "142 Mettu Street",
        "BUSINESS_PINCODE": "63150",
    })
    assert val_short.validate_registered_address()["status"] == ValidationStatus.INVALID.value

    # Non-6 prefix (e.g. Delhi 110001)
    val_delhi = BusinessIdentityValidator(env_override={
        "BUSINESS_ADDRESS_LINE1": "142 Mettu Street",
        "BUSINESS_PINCODE": "110001",
    })
    assert val_delhi.validate_registered_address()["status"] == ValidationStatus.INVALID.value


def test_missing_or_placeholder_bank_account_remains_pending():
    """11. Placeholder bank account is PENDING."""
    val = BusinessIdentityValidator(env_override={"BANK_ACCOUNT_NUMBER": "39882200192"})
    res = val.validate_banking_and_remittance()

    assert res["status"] == ValidationStatus.PENDING.value


def test_invalid_ifsc_structure_is_rejected():
    """12. Malformed IFSC or non-SBI prefix is marked INVALID."""
    val_bad_ifsc = BusinessIdentityValidator(env_override={
        "BANK_ACCOUNT_NUMBER": "409911223344",
        "BANK_IFSC": "INVALIDIFSC1",
    })
    assert val_bad_ifsc.validate_banking_and_remittance()["status"] == ValidationStatus.INVALID.value


def test_sensitive_fields_are_redacted_in_output():
    """13. Bank account numbers must be masked as [REDACTED] in output."""
    raw_acc = "409911223344"
    val = BusinessIdentityValidator(env_override={
        "BANK_ACCOUNT_NUMBER": raw_acc,
        "BANK_IFSC": "SBIN0000853",
    })
    res = val.validate_banking_and_remittance()
    json_str = json.dumps(res)

    assert raw_acc not in json_str
    assert res["value_display"] == "[REDACTED]"


def test_tax_configuration_invariants():
    """14. Tax configuration strictly enforces 5% handloom rate and TN state code 33."""
    val_correct = BusinessIdentityValidator()
    assert val_correct.validate_tax_configuration()["status"] == ValidationStatus.VALID.value

    # Wrong rate (e.g. 18%)
    val_wrong_rate = BusinessIdentityValidator(env_override={"DEFAULT_GST_RATE": 18.0})
    assert val_wrong_rate.validate_tax_configuration()["status"] == ValidationStatus.INVALID.value


def test_deterministic_json_output():
    """15. JSON output contains all required fields and metadata."""
    val = BusinessIdentityValidator()
    report = val.run_all()

    assert "phase" in report
    assert "component" in report
    assert "summary" in report
    assert "checks" in report
    assert "verdict" in report


def test_complete_valid_business_identity_simulation():
    """16. Fully verified business identity passes with production_ready = True."""
    valid_env = {
        "BUSINESS_GSTIN": "33ABCDE1234F1Z5",
        "GST_CERTIFICATE_SUPPLIED": True,
        "BUSINESS_LEGAL_NAME": "PVS Silk S Private Limited",
        "BUSINESS_NAME": "PVS Silk S",
        "BUSINESS_ADDRESS_LINE1": "142 Mettu Street",
        "BUSINESS_CITY": "Kanchipuram",
        "BUSINESS_STATE": "Tamil Nadu",
        "BUSINESS_PINCODE": "631501",
        "BUSINESS_PHONE": "+91 98427 12345",
        "BUSINESS_EMAIL": "contact@pvssilks.com",
        "BUSINESS_BILLING_EMAIL": "billing@pvssilks.com",
        "BANK_NAME": "State Bank of India",
        "BANK_ACCOUNT_NAME": "PVS Silk S Private Limited",
        "BANK_ACCOUNT_NUMBER": "409911223344",
        "BANK_IFSC": "SBIN0000853",
        "BANK_UPI_ID": "pvssilks@sbi",
        "GST_ENABLED": True,
        "DEFAULT_GST_RATE": 5.0,
        "BUSINESS_STATE_CODE": "33",
        "INVOICE_PREFIX": "INV",
    }
    val = BusinessIdentityValidator(env_override=valid_env)
    report = val.run_all()

    assert report["summary"]["total_checks"] == 6
    assert report["summary"]["valid"] == 6
    assert report["summary"]["pending"] == 0
    assert report["summary"]["invalid"] == 0
    assert report["summary"]["production_ready"] is True
    assert report["verdict"] == "BUSINESS IDENTITY VERIFIED"
