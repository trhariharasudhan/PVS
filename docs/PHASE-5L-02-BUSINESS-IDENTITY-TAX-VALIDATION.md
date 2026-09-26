# PVS Silk S — Phase 5L-02: Business Identity & Tax Ingestion Validator

**Phase:** 5L-02 — Business Identity & Tax Ingestion Validator  
**Module:** [`backend/app/core/business_identity_validator.py`](file:///d:/PVS/backend/app/core/business_identity_validator.py)  
**Test Suite:** [`backend/app/tests/test_business_identity_validator.py`](file:///d:/PVS/backend/app/tests/test_business_identity_validator.py) `(16/16 PASS)`  
**Status:** **VALIDATOR ACTIVE (FAIL-CLOSED: TRUE) — BUSINESS DATA ONBOARDING PENDING**  

---

> [!IMPORTANT]
> **SAFETY & COMPLIANCE NOTICE:**  
> Phase 5L-02 creates an isolated, deterministic, fail-closed validation layer for business identity, GST/tax, address, and bank remittance inputs.  
> **Phase 5L-02 does not deploy to production, modify DNS, issue live TLS certificates, fabricate GSTINs or bank details, or mark government registration as verified without authoritative evidence.**

---

## 1. Objective & Scope

Phase 5L-02 establishes an automated, auditable validation layer for genuine **PVS Silk S** business identity information. It ensures that when the business owner supplies official registration details, the system validates them against statutory structural and jurisdictional rules without making unsafe assumptions or generating mock credentials.

---

## 2. Validation Architecture & Invariants

```
                             [ Raw Business Inputs ]
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
[ Statutory GSTIN ]          [ Registered Address ]          [ Bank Remittance ]
• 15-char Regex check        • Line 1 non-placeholder        • 9-18 digit account
• Valid State Prefix         • TN State consistency          • Valid IFSC format
• Tamil Nadu (33) Code       • 6-digit PIN (starts with 6)   • SBI Prefix (SBIN)
• Distinguishes Format vs    • Locality / City present       • Account masked as
  Government Verification                                      [REDACTED]
        |                              |                              |
        +------------------------------+------------------------------+
                                       |
                      [ Tax Engine Invariants (Invoice) ]
                      • GST_ENABLED = True
                      • DEFAULT_GST_RATE = 5.0% (Pure Silk Sarees)
                      • BUSINESS_STATE_CODE = "33"
                      • INVOICE_PREFIX = "INV"
                                       |
                 [ All 6 Checks == VALID & Verified ? ]
                         /                            \
                     (Yes)                            (No)
                      /                                 \
          [ PRODUCTION READY ]               [ FAIL-CLOSED: PENDING ]
```

---

## 3. Detailed Validation Rules

### A. Statutory GSTIN Validation & Verification Distinction
- **Length & Structure:** Exactly 15 alphanumeric characters matching statutory Indian GST format `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
- **State Jurisdiction:** First 2 digits must map to a valid Indian State/UT code. For PVS Silk S, the prefix must be `33` (Tamil Nadu).
- **Format vs. Official Verification:**
  - `FORMAT_VALID`: Structural regex and state code are valid, but government registration certificate has not been verified (`REGISTRATION_UNVERIFIED`).
  - `VALID`: Structural format is valid AND authoritative registration certificate has been supplied (`GOVERNMENT_REGISTRATION_VERIFIED`).
- **Placeholder Rejection:** Rejects default placeholder `33AAAAA0000A1Z5`.

### B. Legal Business Entity & Brand
- **Legal Incorporation Name:** Non-empty, minimum length $\ge 3$, not placeholder (`PVS Silk S Private Limited`).
- **Commercial Trade Name:** Non-empty commercial brand name (`PVS Silk S`).

### C. Showroom & Workshop Physical Address
- **Address Line 1:** Must not equal development placeholder (`42, Weavers Colony`).
- **State Consistency:** Must match `Tamil Nadu`.
- **PIN Code:** 6 numeric digits starting with `6` (Tamil Nadu postal zone). Kanchipuram showroom PIN code must match `631501` or valid local postal area.

### D. Corporate Bank Remittance Instructions
- **Account Number:** 9 to 18 numeric digits; rejects placeholder `39882200192`.
- **IFSC Code:** 11 characters matching `^[A-Z]{4}0[A-Z0-9]{6}$` with `SBIN` prefix for State Bank of India.
- **Sensitive Redaction:** Bank account numbers are strictly masked as `[REDACTED]` in all CLI and JSON streams.

### E. Tax Engine Invariants
- Enforces statutory Handloom pure silk saree GST rate of **5.0%** (CGST 2.5% + SGST 2.5% or IGST 5.0%).
- Enforces `GST_ENABLED = True` and `BUSINESS_STATE_CODE = "33"`.

---

## 4. CLI Commands & Deterministic Output

### CLI Execution
```powershell
python -m app.core.business_identity_validator --dry-run
```

```powershell
python -m app.core.business_identity_validator --json
```

### Dry-Run JSON Contract (Fail-Closed Default State)
```json
{
  "phase": "5L-02",
  "component": "business_identity_validator",
  "fail_closed": true,
  "summary": {
    "total_checks": 6,
    "valid": 3,
    "format_valid": 0,
    "pending": 3,
    "invalid": 0,
    "blocked": 0,
    "production_ready": false
  },
  "checks": [
    {
      "check_id": "TAX-GSTIN-01",
      "category": "Tax & Compliance",
      "name": "Statutory GSTIN Structural & Registration Verification",
      "status": "PENDING",
      "verification_level": "UNVERIFIED",
      "is_sensitive": false,
      "value_display": "33AAAAA0000A1Z5",
      "details": "Default development placeholder GSTIN active ('33AAAAA0000A1Z5'). Official 15-digit GSTIN required.",
      "required_action": "Supply official 15-digit Tamil Nadu GSTIN registration certificate."
    }
  ],
  "verdict": "BUSINESS IDENTITY ONBOARDING PENDING (FAIL-CLOSED)"
}
```

---

## 5. Automated Test Coverage

The validator is verified by [`backend/app/tests/test_business_identity_validator.py`](file:///d:/PVS/backend/app/tests/test_business_identity_validator.py) with 16 test cases:
1. `test_validator_default_execution_is_fail_closed`
2. `test_missing_or_placeholder_gstin_remains_pending`
3. `test_invalid_gstin_length_is_invalid`
4. `test_invalid_gstin_character_structure_is_invalid`
5. `test_invalid_state_code_prefix_is_invalid`
6. `test_non_tamil_nadu_state_code_is_invalid_for_pvs`
7. `test_valid_gstin_distinguishes_format_from_government_verification`
8. `test_missing_or_placeholder_legal_entity_remains_pending`
9. `test_missing_or_placeholder_showroom_address_remains_pending`
10. `test_invalid_pincode_format_is_rejected`
11. `test_missing_or_placeholder_bank_account_remains_pending`
12. `test_invalid_ifsc_structure_is_rejected`
13. `test_sensitive_fields_are_redacted_in_output`
14. `test_tax_configuration_invariants`
15. `test_deterministic_json_output`
16. `test_complete_valid_business_identity_simulation`

---

## 6. Next Phase

**Phase 5L-03** will implement the **Catalogue & Media Asset Production Validator**, providing dry-run verification for real saree inventory SKUs and high-resolution photography assets once provided by merchandising.
