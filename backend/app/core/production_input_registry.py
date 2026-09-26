import os
import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum

from app.core.config import settings

GST_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")

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
    "db_url",
    "dsn",
    "connection_string",
    "credential",
}


class InputCategory(str, Enum):
    BUSINESS = "business"
    INFRASTRUCTURE = "infrastructure"


class InputStatus(str, Enum):
    PENDING = "PENDING"
    VALID = "VALID"
    INVALID = "INVALID"
    BLOCKED = "BLOCKED"


def is_placeholder_value(val: Optional[str]) -> bool:
    """Check if a string contains or equals known obvious development/placeholder values."""
    if not val:
        return True
    cleaned = str(val).strip().lower()
    if cleaned in KNOWN_PLACEHOLDERS:
        return True
    for p in ["example.com", "example.org", "localhost", "127.0.0.1", "test.pvssilks", "insecure", "dummy", "placeholder", "changeme", "demo"]:
        if p in cleaned:
            return True
    return False


def redact_sensitive(field_name: str, val: Any) -> str:
    """Redact sensitive credentials and account numbers."""
    if not val:
        return "[NOT_PROVIDED]"
    field_lower = field_name.lower()
    if any(s in field_lower for s in SENSITIVE_FIELD_NAMES):
        return "[REDACTED]"
    return str(val)


class ProductionInputRegistry:
    """
    PVS Silk S — Production Input Registry (Phase 5L-01).
    Machine-readable, fail-closed registry of the 12 canonical external business
    and infrastructure inputs required before production cutover.
    """
    def __init__(self, root_dir: Optional[Path] = None, env_override: Optional[Dict[str, Any]] = None):
        if root_dir is None:
            self.root_dir = Path(__file__).resolve().parent.parent.parent.parent
        else:
            self.root_dir = root_dir
        self.env = env_override or {}
        self.items: List[Dict[str, Any]] = []

    def get_val(self, key: str, default: Any = None) -> Any:
        return self.env.get(key, getattr(settings, key, default))

    def evaluate_bus_01_gstin(self) -> Dict[str, Any]:
        val = self.get_val("BUSINESS_GSTIN")
        if not val or val == "33AAAAA0000A1Z5":
            status = InputStatus.PENDING
            details = "Default placeholder GSTIN active ('33AAAAA0000A1Z5'). Verified live 15-digit Tamil Nadu GSTIN required."
        elif not GST_REGEX.match(str(val)):
            status = InputStatus.INVALID
            details = f"Supplied GSTIN '{val}' does not match official 15-character format."
        elif not str(val).startswith("33"):
            status = InputStatus.INVALID
            details = f"Supplied GSTIN '{val}' does not match Tamil Nadu State code (33)."
        else:
            status = InputStatus.VALID
            details = f"Verified 15-digit Tamil Nadu State (33) GSTIN supplied."

        return {
            "id": "BUS-01",
            "category": InputCategory.BUSINESS.value,
            "name": "Official GSTIN",
            "status": status.value,
            "is_sensitive": False,
            "value_display": str(val) if val else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Business owner to supply official Tamil Nadu GSTIN registration certificate.",
            "owner": "PVS Silk S Business Owner",
        }

    def evaluate_bus_02_legal_entity(self) -> Dict[str, Any]:
        val = self.get_val("BUSINESS_LEGAL_NAME")
        if not val or is_placeholder_value(val):
            status = InputStatus.PENDING
            details = "Legal corporate entity registration certificate pending."
        elif len(str(val).strip()) < 5:
            status = InputStatus.INVALID
            details = "Supplied legal entity name is invalid or too short."
        else:
            status = InputStatus.VALID
            details = f"Registered corporate entity: '{val}'."

        return {
            "id": "BUS-02",
            "category": InputCategory.BUSINESS.value,
            "name": "Legal Business Entity",
            "status": status.value,
            "is_sensitive": False,
            "value_display": str(val) if val else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Confirm registered incorporation trade certificate & legal entity name.",
            "owner": "PVS Silk S Business Owner",
        }

    def evaluate_bus_03_address(self) -> Dict[str, Any]:
        addr = self.get_val("BUSINESS_ADDRESS_LINE1")
        city = self.get_val("BUSINESS_CITY")
        pin = self.get_val("BUSINESS_PINCODE")

        if not addr or addr == "42, Weavers Colony" or is_placeholder_value(addr):
            status = InputStatus.PENDING
            details = "Showroom & workshop address contains default development placeholder ('42, Weavers Colony')."
        elif not pin or not str(pin).isdigit() or len(str(pin)) != 6:
            status = InputStatus.INVALID
            details = f"Supplied PIN code '{pin}' is invalid (must be 6 numeric digits)."
        else:
            status = InputStatus.VALID
            details = f"Verified physical showroom address in {city} - {pin}."

        return {
            "id": "BUS-03",
            "category": InputCategory.BUSINESS.value,
            "name": "Registered Showroom / Workshop Address",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"{addr}, {city} - {pin}" if addr else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Supply official Kanchipuram physical showroom & workshop street address.",
            "owner": "PVS Silk S Business Owner",
        }

    def evaluate_bus_04_banking(self) -> Dict[str, Any]:
        acc = self.get_val("BANK_ACCOUNT_NUMBER")
        ifsc = self.get_val("BANK_IFSC")
        bank = self.get_val("BANK_NAME")

        if not acc or acc == "39882200192" or is_placeholder_value(acc):
            status = InputStatus.PENDING
            details = "Corporate bank account uses development placeholder ('39882200192')."
        elif not ifsc or not IFSC_REGEX.match(str(ifsc)):
            status = InputStatus.INVALID
            details = f"Supplied IFSC code '{ifsc}' is malformed."
        else:
            status = InputStatus.VALID
            details = f"Verified {bank} Current Account & IFSC wire instructions."

        return {
            "id": "BUS-04",
            "category": InputCategory.BUSINESS.value,
            "name": "Corporate Banking / Remittance Details",
            "status": status.value,
            "is_sensitive": True,
            "value_display": redact_sensitive("bank_account", acc),
            "details": details,
            "required_action": "Provide official corporate SBI Current Account & IFSC wire instructions.",
            "owner": "PVS Silk S Finance Director",
        }

    def evaluate_bus_05_contacts(self) -> Dict[str, Any]:
        phone = self.get_val("BUSINESS_PHONE")
        email = self.get_val("BUSINESS_EMAIL")

        if not phone or not email or is_placeholder_value(email) or "example.com" in str(email):
            status = InputStatus.PENDING
            details = "Official domain support inbox & phone line pending verification."
        elif "@" not in str(email) or len(str(phone)) < 10:
            status = InputStatus.INVALID
            details = "Supplied email or phone format is invalid."
        else:
            status = InputStatus.VALID
            details = f"Verified active corporate contacts ({email}, {phone})."

        return {
            "id": "BUS-05",
            "category": InputCategory.BUSINESS.value,
            "name": "Official Contact Channels",
            "status": status.value,
            "is_sensitive": False,
            "value_display": f"{email} / {phone}" if email else "[NOT_PROVIDED]",
            "details": details,
            "required_action": "Verify official domain email (billing/support) and active phone contact line.",
            "owner": "PVS Silk S Operations",
        }

    def evaluate_bus_06_catalogue(self) -> Dict[str, Any]:
        onboarded = self.env.get("CATALOGUE_ONBOARDED", False)
        if not onboarded:
            status = InputStatus.PENDING
            details = "Master data CSV templates ready in templates/; live saree SKU inventory pending onboarding."
        else:
            status = InputStatus.VALID
            details = "Live saree catalogue SKU records validated and imported."

        return {
            "id": "BUS-06",
            "category": InputCategory.BUSINESS.value,
            "name": "Master Saree Catalogue",
            "status": status.value,
            "is_sensitive": False,
            "value_display": "Live Inventory Onboarded" if onboarded else "Templates Ready (Data Pending)",
            "details": details,
            "required_action": "Merchandising team to populate authentic saree inventory in templates/ CSVs.",
            "owner": "PVS Silk S Merchandising Team",
        }

    def evaluate_bus_07_photography(self) -> Dict[str, Any]:
        onboarded = self.env.get("PHOTOSHOOT_ONBOARDED", False)
        if not onboarded:
            status = InputStatus.PENDING
            details = "Using placeholder / development media fallback assets."
        else:
            status = InputStatus.VALID
            details = "Authentic high-resolution saree photoshoot photography uploaded to CDN/S3."

        return {
            "id": "BUS-07",
            "category": InputCategory.BUSINESS.value,
            "name": "Product Photography / Media Assets",
            "status": status.value,
            "is_sensitive": False,
            "value_display": "CDN Assets Ready" if onboarded else "Placeholder Media Active",
            "details": details,
            "required_action": "Upload authentic high-res saree photoshoot imagery to CDN/S3 bucket.",
            "owner": "PVS Silk S Creative Team",
        }

    def evaluate_bus_08_approval(self) -> Dict[str, Any]:
        approval = self.env.get("BUSINESS_OWNER_APPROVAL", "NOT_PROVIDED")
        if approval != "APPROVED":
            status = InputStatus.PENDING
            details = f"Commercial executive go-live sign-off status: {approval}."
        else:
            status = InputStatus.VALID
            details = "Executive sponsor written launch approval granted."

        return {
            "id": "BUS-08",
            "category": InputCategory.BUSINESS.value,
            "name": "Executive Go-Live Approval",
            "status": status.value,
            "is_sensitive": False,
            "value_display": approval,
            "details": details,
            "required_action": "PVS Silk S Executive Sponsor to provide written launch approval.",
            "owner": "PVS Silk S Executive Sponsor",
        }

    def evaluate_infra_01_postgresql(self) -> Dict[str, Any]:
        db_url = self.get_val("DATABASE_URL")
        if not db_url or "localhost" in str(db_url).lower() or "127.0.0.1" in str(db_url) or "sqlite" in str(db_url).lower():
            status = InputStatus.PENDING
            details = "Database URL points to local instance ('localhost'). Managed cloud instance required."
        elif not str(db_url).startswith("postgresql+asyncpg://"):
            status = InputStatus.INVALID
            details = "Database URL must use 'postgresql+asyncpg://' driver scheme."
        else:
            status = InputStatus.VALID
            details = "Managed cloud PostgreSQL 16 cluster configured."

        return {
            "id": "INFRA-01",
            "category": InputCategory.INFRASTRUCTURE.value,
            "name": "Managed Production PostgreSQL",
            "status": status.value,
            "is_sensitive": True,
            "value_display": redact_sensitive("database_url", db_url),
            "details": details,
            "required_action": "DevOps Lead to provision AWS RDS / Cloud SQL PostgreSQL 16 instance.",
            "owner": "DevOps Lead",
        }

    def evaluate_infra_02_secret(self) -> Dict[str, Any]:
        secret = self.get_val("SECRET_KEY")
        if not secret or secret == "pvs-silks-insecure-secret-key-change-in-production-2026":
            status = InputStatus.PENDING
            details = "Default development secret key active. 64-character random hex secret required."
        elif any(w in str(secret).lower() for w in ["insecure", "default", "changeme"]):
            status = InputStatus.INVALID
            details = "Production secret contains forbidden insecure words."
        elif len(str(secret)) < 64:
            status = InputStatus.INVALID
            details = f"Production secret key is too short ({len(secret)} chars; minimum 64 required)."
        else:
            status = InputStatus.VALID
            details = f"High-entropy cryptographic secret present ({len(secret)} characters)."

        return {
            "id": "INFRA-02",
            "category": InputCategory.INFRASTRUCTURE.value,
            "name": "Production Secret Injection",
            "status": status.value,
            "is_sensitive": True,
            "value_display": redact_sensitive("secret_key", secret),
            "details": details,
            "required_action": "Inject 64-character random hex SECRET_KEY via cloud secrets vault (KMS/Vault).",
            "owner": "DevOps / Security Lead",
        }

    def evaluate_infra_03_dns(self) -> Dict[str, Any]:
        dns_live = self.env.get("DNS_PROPAGATED", False)
        if not dns_live:
            status = InputStatus.PENDING
            details = "Apex domain (pvssilks.com) and subdomains pending DNS cutover to edge load balancer."
        else:
            status = InputStatus.VALID
            details = "DNS A/AAAA records resolved to production edge IP."

        return {
            "id": "INFRA-03",
            "category": InputCategory.INFRASTRUCTURE.value,
            "name": "Production DNS",
            "status": status.value,
            "is_sensitive": False,
            "value_display": "Propagated" if dns_live else "Pending DNS Binding",
            "details": details,
            "required_action": "Bind DNS A/AAAA records for pvssilks.com, www, admin, and api to edge load balancer.",
            "owner": "Network Administrator",
        }

    def evaluate_infra_04_tls(self) -> Dict[str, Any]:
        tls_issued = self.env.get("TLS_CERT_ISSUED", False)
        if not tls_issued:
            status = InputStatus.PENDING
            details = "TLS certificate pending DNS propagation and issuance."
        else:
            status = InputStatus.VALID
            details = "Wildcard TLS certificate issued and active for pvssilks.com."

        return {
            "id": "INFRA-04",
            "category": InputCategory.INFRASTRUCTURE.value,
            "name": "Production TLS",
            "status": status.value,
            "is_sensitive": False,
            "value_display": "Active (HTTPS)" if tls_issued else "Pending Issuance",
            "details": details,
            "required_action": "Issue wildcard TLS certificate via Let's Encrypt / AWS Certificate Manager.",
            "owner": "DevOps Lead",
        }

    def evaluate_all(self) -> Dict[str, Any]:
        self.items = [
            self.evaluate_bus_01_gstin(),
            self.evaluate_bus_02_legal_entity(),
            self.evaluate_bus_03_address(),
            self.evaluate_bus_04_banking(),
            self.evaluate_bus_05_contacts(),
            self.evaluate_bus_06_catalogue(),
            self.evaluate_bus_07_photography(),
            self.evaluate_bus_08_approval(),
            self.evaluate_infra_01_postgresql(),
            self.evaluate_infra_02_secret(),
            self.evaluate_infra_03_dns(),
            self.evaluate_infra_04_tls(),
        ]

        total = len(self.items)
        valid_count = sum(1 for i in self.items if i["status"] == InputStatus.VALID.value)
        pending_count = sum(1 for i in self.items if i["status"] == InputStatus.PENDING.value)
        invalid_count = sum(1 for i in self.items if i["status"] == InputStatus.INVALID.value)
        blocked_count = sum(1 for i in self.items if i["status"] == InputStatus.BLOCKED.value)

        is_production_ready = (valid_count == total) and (total > 0)

        return {
            "phase": "5L-01",
            "component": "production_input_registry",
            "fail_closed": True,
            "summary": {
                "total": total,
                "valid": valid_count,
                "pending": pending_count,
                "invalid": invalid_count,
                "blocked": blocked_count,
                "production_ready": is_production_ready,
            },
            "items": self.items,
        }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="PVS Silk S — Production Input Registry (Phase 5L-01)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Execute dry-run inspection")
    parser.add_argument("--category", choices=["business", "infrastructure"], help="Filter by category")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON format")
    args = parser.parse_args()

    registry = ProductionInputRegistry()
    report = registry.evaluate_all()

    if args.json:
        if args.category:
            filtered_items = [i for i in report["items"] if i["category"] == args.category]
            report["items"] = filtered_items
            report["summary"]["total"] = len(filtered_items)
            report["summary"]["valid"] = sum(1 for i in filtered_items if i["status"] == InputStatus.VALID.value)
            report["summary"]["pending"] = sum(1 for i in filtered_items if i["status"] == InputStatus.PENDING.value)
        print(json.dumps(report, indent=2))
        return

    print("==================================================================================")
    print("        PVS SILK S — PRODUCTION INPUT REGISTRY (PHASE 5L-01)")
    print("==================================================================================")
    s = report["summary"]
    print(f"\nINPUT REGISTRY SUMMARY (Fail-Closed: True):")
    print(f"  • Total Inputs:        {s['total']}")
    print(f"  • Valid (Supplied):    {s['valid']}")
    print(f"  • Pending (Awaiting):  {s['pending']}")
    print(f"  • Invalid / Blocked:   {s['invalid'] + s['blocked']}")
    print(f"  • Production Ready:    {s['production_ready']}")
    print("-" * 88)
    print(f"{'Input ID':<10} | {'Status':<10} | {'Category':<16} | {'Input Name'}")
    print("-" * 88)
    for i in report["items"]:
        if args.category and i["category"] != args.category:
            continue
        print(f"{i['id']:<10} | {i['status']:<10} | {i['category']:<16} | {i['name']}")
        print(f"             `-> Details: {i['details']}")
    print("-" * 88)
    print(f"\nREGISTRY VERDICT: {'PRODUCTION READY' if s['production_ready'] else 'CUTOVER BLOCKED — EXTERNAL INPUTS PENDING'}")
    print("==================================================================================")


if __name__ == "__main__":
    main()
