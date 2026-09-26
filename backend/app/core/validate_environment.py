"""
PVS Silk S — Environment Configuration Validation CLI

Run via:
    python -m app.core.validate_environment

Audits the active environment configuration without printing sensitive credentials,
passwords, JWT secrets, database connection strings, or bank account numbers.
"""

import sys
import re
from app.core.config import settings

# Ensure proper utf-8 stream output across Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def mask_secret(value: str) -> str:
    if not value:
        return "[MISSING]"
    if "insecure" in value.lower() or "example" in value.lower():
        return "[INSECURE_DEFAULT]"
    return f"[SET: {len(value)} chars]"


def audit_environment():
    print("=" * 70)
    print("  PVS SILK S — ENVIRONMENT & PRODUCTION READINESS AUDITOR")
    print("=" * 70)
    print(f"Environment Mode : {settings.ENVIRONMENT.upper()}")
    print(f"Debug Mode       : {settings.DEBUG}")
    print(f"API Version      : {settings.VERSION}")
    print("-" * 70)

    checks = []

    # 1. Secret Key
    secret_status = "VALID"
    if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32 or "insecure" in settings.SECRET_KEY.lower():
        secret_status = "INVALID (Weak / Default)" if settings.is_production else "DEV_DEFAULT"
    checks.append(("SECRET_KEY (Cryptographic Strength)", secret_status, mask_secret(settings.SECRET_KEY)))

    # 2. Database URL
    db_status = "VALID"
    is_local_db = "localhost" in settings.DATABASE_URL or "127.0.0.1" in settings.DATABASE_URL
    if is_local_db:
        db_status = "INVALID (Localhost in Production)" if settings.is_production else "LOCAL_DEV_DB"
    checks.append(("DATABASE_URL (Engine Isolation)", db_status, "[CONFIGURED]"))

    # 3. Business Identity
    biz_id_status = "VALID" if settings.BUSINESS_NAME and settings.BUSINESS_PHONE and settings.BUSINESS_EMAIL else "INCOMPLETE"
    checks.append(("Business Identity (Name, Phone, Email)", biz_id_status, f"{settings.BUSINESS_NAME} | {settings.BUSINESS_EMAIL}"))

    # 4. GSTIN
    gst_status = "DISABLED"
    if settings.GST_ENABLED:
        gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
        if not settings.BUSINESS_GSTIN or "0000A1Z5" in settings.BUSINESS_GSTIN or not re.match(gstin_regex, settings.BUSINESS_GSTIN):
            gst_status = "INVALID (Placeholder / Format)" if settings.is_production else "DEV_PLACEHOLDER"
        else:
            gst_status = "VALID (Format Verified)"
    checks.append(("Statutory GSTIN", gst_status, f"State: {settings.BUSINESS_STATE_CODE}"))

    # 5. Bank Wire Remittance
    bank_status = "VALID"
    if not settings.BANK_ACCOUNT_NUMBER or "REPLACE" in settings.BANK_ACCOUNT_NUMBER or not settings.BANK_IFSC:
        bank_status = "INCOMPLETE" if settings.is_production else "DEV_PLACEHOLDER"
    checks.append(("Bank Remittance (Invoicing)", bank_status, f"{settings.BANK_NAME} (IFSC: {settings.BANK_IFSC})"))

    # 6. CORS Origins
    cors_status = "VALID"
    has_insecure_cors = any("localhost" in o or "127.0.0.1" in o or o == "*" for o in settings.CORS_ORIGINS)
    if has_insecure_cors and settings.is_production:
        cors_status = "INVALID (Localhost / Wildcard in Prod)"
    checks.append(("CORS Origins Policy", cors_status, f"{len(settings.CORS_ORIGINS)} origin(s) configured"))

    # 7. Cookie Security
    cookie_sec_status = "SECURE (HTTPS)" if settings.effective_cookie_secure else "HTTP_ONLY (Dev Mode)"
    checks.append(("Cookie Transport Security", cookie_sec_status, f"SameSite={settings.COOKIE_SAMESITE}"))

    for label, status_str, detail in checks:
        icon = "[OK]" if "VALID" in status_str or "SECURE" in status_str or (not settings.is_production and "DEV" in status_str) else "[WARN]"
        print(f" {icon:<6} {label:<42} : {status_str:<22} ({detail})")

    print("-" * 70)

    if settings.is_production:
        errors = settings.validate_production_readiness()
        if errors:
            print("[PRODUCTION BLOCKERS DETECTED]:")
            for err in errors:
                print(f"  [BLOCKER] {err}")
            print("=" * 70)
            sys.exit(1)
        else:
            print("[OK] [PRODUCTION READY] All production security invariants verified.")
    else:
        print(f"[OK] [{settings.ENVIRONMENT.upper()} MODE] Configuration valid for development/staging workflow.")
    print("=" * 70)


if __name__ == "__main__":
    audit_environment()
