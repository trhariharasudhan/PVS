import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum

from app.core.config import settings

GST_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
PIN_REGEX = re.compile(r"^[1-9][0-9]{5}$")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
UPI_REGEX = re.compile(r"^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$")

VALID_INDIAN_GST_STATE_CODES = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu",
    "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh (Old)",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh (New)",
    "38": "Ladakh",
    "97": "Other Territory",
    "99": "Centre Jurisdiction",
}

KNOWN_PLACEHOLDERS = {
    "localhost",
    "127.0.0.1",
    "example.com",
    "example.org",
    "test@example.com",
    "demo",
    "dummy",
    "placeholder",
    "changeme",
    "password",
    "secret",
    "fake",
    "sample",
    "test",
    "33aaaaa0000a1z5",
    "42, weavers colony",
    "39882200192",
}

SENSITIVE_FIELD_NAMES = {
    "password",
    "secret",
    "secret_key",
    "token",
    "authorization",
    "cookie",
    "client_secret",
    "bank_account",
    "bank_account_number",
    "database_url",
}


class ValidationStatus(str, Enum):
    PENDING = "PENDING"
    FORMAT_VALID = "FORMAT_VALID"
    VALID = "VALID"
    INVALID = "INVALID"
    BLOCKED = "BLOCKED"
    REGISTRATION_UNVERIFIED = "REGISTRATION_UNVERIFIED"


def is_placeholder(val: Optional[str]) -> bool:
    if not val:
        return True
    cleaned = str(val).strip().lower()
    if cleaned in KNOWN_PLACEHOLDERS:
        return True
    for p in ["example.com", "example.org", "localhost", "127.0.0.1", "test.pvssilks", "insecure", "dummy", "placeholder", "changeme", "demo"]:
        if p in cleaned:
            return True
    return False


def mask_sensitive(field_name: str, val: Any) -> str:
    if not val:
        return "[NOT_PROVIDED]"
    field_lower = field_name.lower()
    if any(s in field_lower for s in SENSITIVE_FIELD_NAMES):
        return "[REDACTED]"
    return str(val)


class BusinessIdentityValidator:
    """
    PVS Silk S — Business Identity & Tax Ingestion Validator (Phase 5L-02).
    Deterministic, fail-closed validation engine for real legal business identity,
    GSTIN format vs government registration verification, showroom address,
    corporate bank remittance instructions, and 5% GST tax billing invariants.
    """
    def __init__(self, root_dir: Optional[Path] = None, env_override: Optional[Dict[str, Any]] = None):
        if root_dir is None:
            self.root_dir = Path(__file__).resolve().parent.parent.parent.parent
        else:
            self.root_dir = root_dir
        self.env = env_override or {}
        self.checks: List[Dict[str, Any]] = []

    def get_val(self, key: str, default: Any = None) -> Any:
        return self.env.get(key, getattr(settings, key, default))

    def validate_gstin(self) -> Dict[str, Any]:
        """Validate structural format vs official registration verification distinction."""
        gstin_raw = self.get_val("BUSINESS_GSTIN")
        cert_supplied = self.env.get("GST_CERTIFICATE_SUPPLIED", False)

        if not gstin_raw or gstin_raw == "33AAAAA0000A1Z5" or is_placeholder(gstin_raw):
            status = ValidationStatus.PENDING
            details = "Default development placeholder GSTIN active ('33AAAAA0000A1Z5'). Official 15-digit GSTIN required."
            verification = "UNVERIFIED"
        elif len(str(gstin_raw).strip()) != 15:
            status = ValidationStatus.INVALID
            details = f"GSTIN must be exactly 15 characters (received {len(str(gstin_raw).strip())})."
            verification = "INVALID"
        elif not GST_REGEX.match(str(gstin_raw).strip().upper()):
            status = ValidationStatus.INVALID
            details = f"GSTIN '{gstin_raw}' fails statutory alphanumeric character structure."
            verification = "INVALID"
        else:
            state_code = str(gstin_raw)[:2]
            if state_code not in VALID_INDIAN_GST_STATE_CODES:
                status = ValidationStatus.INVALID
                details = f"Invalid GST state code prefix '{state_code}'."
                verification = "INVALID"
            elif state_code != "33":
                status = ValidationStatus.INVALID
                details = f"State code prefix '{state_code}' does not match Tamil Nadu jurisdiction (33)."
                verification = "INVALID"
            else:
                if cert_supplied:
                    status = ValidationStatus.VALID
                    details = f"Statutory format valid and authoritative GST registration certificate verified for Tamil Nadu (33)."
                    verification = "GOVERNMENT_REGISTRATION_VERIFIED"
                else:
                    status = ValidationStatus.FORMAT_VALID
                    details = f"Statutory 15-digit format is valid for Tamil Nadu (33). Registration certificate pending human verification."
                    verification = "REGISTRATION_UNVERIFIED"

        return {
            "check_id": "TAX-GSTIN-01",
            "category": "Tax & Compliance",
            "name": "Statutory GSTIN Structural & Registration Verification",
            "status": status.value,
            "verification_level": verification,
            "is_sensitive": False,
            "value_display": str(gstin_raw) if gstin_raw else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Supply official 15-digit Tamil Nadu GSTIN registration certificate.",
        }

    def validate_legal_entity(self) -> Dict[str, Any]:
        """Validate legal corporate incorporation name and commercial trade name."""
        legal_name = self.get_val("BUSINESS_LEGAL_NAME")
        trade_name = self.get_val("BUSINESS_NAME")

        if not legal_name or is_placeholder(legal_name) or str(legal_name).strip() == "":
            status = ValidationStatus.PENDING
            details = "Legal corporate entity registration name is missing or placeholder."
        elif len(str(legal_name).strip()) < 3:
            status = ValidationStatus.INVALID
            details = f"Legal entity name '{legal_name}' is too short."
        elif not trade_name or is_placeholder(trade_name) or str(trade_name).strip() == "":
            status = ValidationStatus.PENDING
            details = "Commercial brand trade name is missing or placeholder."
        else:
            status = ValidationStatus.VALID
            details = f"Corporate entity '{legal_name}' trading as '{trade_name}'."

        return {
            "check_id": "BIZ-ENTITY-01",
            "category": "Business Identity",
            "name": "Legal Corporate Incorporation & Trade Brand",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"{legal_name} (Trading as: {trade_name})" if legal_name else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Confirm registered trade incorporation certificate.",
        }

    def validate_registered_address(self) -> Dict[str, Any]:
        """Validate registered physical showroom and loom workshop address components."""
        addr1 = self.get_val("BUSINESS_ADDRESS_LINE1")
        city = self.get_val("BUSINESS_CITY")
        state = self.get_val("BUSINESS_STATE")
        pincode = self.get_val("BUSINESS_PINCODE")

        if not addr1 or addr1 == "42, Weavers Colony" or is_placeholder(addr1):
            status = ValidationStatus.PENDING
            details = "Physical showroom address contains default placeholder ('42, Weavers Colony')."
        elif not city or is_placeholder(city):
            status = ValidationStatus.PENDING
            details = "Showroom city / locality is missing."
        elif not state or state != "Tamil Nadu":
            status = ValidationStatus.INVALID
            details = f"State '{state}' must be 'Tamil Nadu' for Kanchipuram silk operations."
        elif not pincode or not PIN_REGEX.match(str(pincode).strip()):
            status = ValidationStatus.INVALID
            details = f"PIN code '{pincode}' is invalid (must be 6 numeric digits starting with non-zero)."
        elif not str(pincode).startswith("6"):
            status = ValidationStatus.INVALID
            details = f"Tamil Nadu PIN codes start with '6' (received '{pincode}')."
        else:
            status = ValidationStatus.VALID
            details = f"Verified showroom address: {addr1}, {city}, {state} - {pincode}."

        return {
            "check_id": "BIZ-ADDR-01",
            "category": "Premises & Location",
            "name": "Showroom & Workshop Physical Address",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"{addr1}, {city}, {state} - {pincode}" if addr1 else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Supply official Kanchipuram showroom & workshop street address.",
        }

    def validate_corporate_contacts(self) -> Dict[str, Any]:
        """Validate official billing and support contact channels."""
        phone = self.get_val("BUSINESS_PHONE")
        email = self.get_val("BUSINESS_EMAIL")
        billing_email = self.get_val("BUSINESS_BILLING_EMAIL")

        if not email or is_placeholder(email) or "example.com" in str(email):
            status = ValidationStatus.PENDING
            details = "Official domain support email is missing or contains placeholder."
        elif not EMAIL_REGEX.match(str(email).strip()):
            status = ValidationStatus.INVALID
            details = f"Email '{email}' format is invalid."
        elif not phone or is_placeholder(phone):
            status = ValidationStatus.PENDING
            details = "Corporate telephone contact line is missing."
        elif len(re.sub(r"[^0-9]", "", str(phone))) < 10:
            status = ValidationStatus.INVALID
            details = f"Phone '{phone}' must contain at least 10 numeric digits."
        else:
            status = ValidationStatus.VALID
            details = f"Active corporate communication channels: {email} / {phone}."

        return {
            "check_id": "BIZ-CONTACT-01",
            "category": "Communications",
            "name": "Official Business Support & Billing Channels",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"{email} / {phone}" if email else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Verify official domain email (billing/support) and telephone contact line.",
        }

    def validate_banking_and_remittance(self) -> Dict[str, Any]:
        """Validate corporate bank remittance instructions with sensitive data masking."""
        bank_name = self.get_val("BANK_NAME")
        acc_holder = self.get_val("BANK_ACCOUNT_NAME")
        acc_num = self.get_val("BANK_ACCOUNT_NUMBER")
        ifsc = self.get_val("BANK_IFSC")
        upi_id = self.get_val("BANK_UPI_ID")

        if not acc_num or acc_num == "39882200192" or is_placeholder(acc_num):
            status = ValidationStatus.PENDING
            details = "Corporate bank account number uses development placeholder ('39882200192')."
        elif not re.match(r"^[0-9]{9,18}$", str(acc_num).strip()):
            status = ValidationStatus.INVALID
            details = "Bank account number must be between 9 and 18 numeric digits."
        elif not ifsc or is_placeholder(ifsc) or not IFSC_REGEX.match(str(ifsc).strip().upper()):
            status = ValidationStatus.INVALID
            details = f"IFSC code '{ifsc}' does not match statutory 11-character structure."
        elif not str(ifsc).upper().startswith("SBIN"):
            status = ValidationStatus.INVALID
            details = f"IFSC '{ifsc}' does not match State Bank of India ('SBIN') branch prefix."
        elif upi_id and not UPI_REGEX.match(str(upi_id).strip()):
            status = ValidationStatus.INVALID
            details = f"UPI ID '{upi_id}' format is invalid."
        else:
            status = ValidationStatus.VALID
            details = f"Verified {bank_name} remittance instructions for '{acc_holder}' (IFSC: {ifsc})."

        return {
            "check_id": "BIZ-BANK-01",
            "category": "Banking & Settlement",
            "name": "Corporate Bank Remittance & Wire Instructions",
            "status": status.value,
            "is_sensitive": True,
            "value_display": mask_sensitive("bank_account_number", acc_num),
            "details": details,
            "required_action": "Provide official corporate SBI Current Account & IFSC wire instructions.",
        }

    def validate_tax_configuration(self) -> Dict[str, Any]:
        """Validate that business tax configuration matches the invoice engine's 5% GST handloom rules."""
        gst_enabled = self.get_val("GST_ENABLED")
        default_rate = self.get_val("DEFAULT_GST_RATE")
        state_code = self.get_val("BUSINESS_STATE_CODE")
        invoice_prefix = self.get_val("INVOICE_PREFIX")

        if not gst_enabled:
            status = ValidationStatus.INVALID
            details = "GST_ENABLED must be True for statutory Indian handloom tax invoicing."
        elif float(default_rate) != 5.0:
            status = ValidationStatus.INVALID
            details = f"DEFAULT_GST_RATE is configured to {default_rate}% (must be 5.0% for pure silk sarees)."
        elif str(state_code) != "33":
            status = ValidationStatus.INVALID
            details = f"BUSINESS_STATE_CODE is {state_code} (must be '33' for Tamil Nadu jurisdiction)."
        elif not invoice_prefix or str(invoice_prefix).strip() == "":
            status = ValidationStatus.INVALID
            details = "INVOICE_PREFIX cannot be empty."
        else:
            status = ValidationStatus.VALID
            details = f"Tax configuration verified: GST Enabled, 5.0% Handloom Rate, TN State Code 33, Prefix '{invoice_prefix}'."

        return {
            "check_id": "TAX-CONFIG-01",
            "category": "Tax & Invoicing Engine",
            "name": "Handloom Saree 5% GST Tax Engine Configuration",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"GST: {gst_enabled}, Rate: {default_rate}%, State: {state_code}, Prefix: {invoice_prefix}",
            "details": details,
            "required_action": "None (Tax configuration matches invoice system rules).",
        }

    def run_all(self) -> Dict[str, Any]:
        self.checks = [
            self.validate_gstin(),
            self.validate_legal_entity(),
            self.validate_registered_address(),
            self.validate_corporate_contacts(),
            self.validate_banking_and_remittance(),
            self.validate_tax_configuration(),
        ]

        total = len(self.checks)
        valid_count = sum(1 for c in self.checks if c["status"] == ValidationStatus.VALID.value)
        format_valid_count = sum(1 for c in self.checks if c["status"] == ValidationStatus.FORMAT_VALID.value)
        pending_count = sum(1 for c in self.checks if c["status"] == ValidationStatus.PENDING.value)
        invalid_count = sum(1 for c in self.checks if c["status"] == ValidationStatus.INVALID.value)
        blocked_count = sum(1 for c in self.checks if c["status"] == ValidationStatus.BLOCKED.value)

        # Strict fail-closed: All checks must be fully VALID (and FORMAT_VALID must have registration verification)
        is_production_ready = (valid_count == total) and (total > 0)

        return {
            "phase": "5L-02",
            "component": "business_identity_validator",
            "fail_closed": True,
            "summary": {
                "total_checks": total,
                "valid": valid_count,
                "format_valid": format_valid_count,
                "pending": pending_count,
                "invalid": invalid_count,
                "blocked": blocked_count,
                "production_ready": is_production_ready,
            },
            "checks": self.checks,
            "verdict": "BUSINESS IDENTITY VERIFIED" if is_production_ready else "BUSINESS IDENTITY ONBOARDING PENDING (FAIL-CLOSED)",
        }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="PVS Silk S — Business Identity & Tax Validator (Phase 5L-02)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Execute dry-run inspection")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON format")
    args = parser.parse_args()

    validator = BusinessIdentityValidator()
    report = validator.run_all()

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print("==================================================================================")
    print("      PVS SILK S — BUSINESS IDENTITY & TAX INGESTION VALIDATOR (PHASE 5L-02)")
    print("==================================================================================")
    s = report["summary"]
    print(f"\nVALIDATION SUMMARY (Fail-Closed: True):")
    print(f"  • Total Checks:            {s['total_checks']}")
    print(f"  • Valid (Fully Verified):  {s['valid']}")
    print(f"  • Format Valid (Pending):  {s['format_valid']}")
    print(f"  • Pending (Awaiting):      {s['pending']}")
    print(f"  • Invalid / Blocked:       {s['invalid'] + s['blocked']}")
    print(f"  • Production Ready:        {s['production_ready']}")
    print("-" * 88)
    print(f"{'Check ID':<16} | {'Status':<16} | {'Category':<22} | {'Check Name'}")
    print("-" * 88)
    for c in report["checks"]:
        print(f"{c['check_id']:<16} | {c['status']:<16} | {c['category']:<22} | {c['name']}")
        print(f"                 `-> Details: {c['details']}")
    print("-" * 88)
    print(f"\nFINAL VERDICT: {report['verdict']}")
    print("==================================================================================")


if __name__ == "__main__":
    main()
