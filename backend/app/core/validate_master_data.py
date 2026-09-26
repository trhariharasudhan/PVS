import csv
import re
import sys
from pathlib import Path
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Optional, Set, Tuple

GST_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-()]{7,25}$")

VALID_AVAILABILITY = {"IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK", "ARCHIVED"}
VALID_SUPPLIER_TYPES = {"SILK_REELER", "ZARI_MANUFACTURER", "DYE_CHEMICALS", "EQUIPMENT", "OTHER"}
VALID_MATERIAL_TYPES = {
    "RAW_SILK", "ZARI_GOLD", "ZARI_SILVER", "DYE_CHEMICAL",
    "COTTON_YARN", "PACKAGING", "CONSUMABLE", "OTHER"
}
VALID_UOM = {"KILOGRAMS", "GRAMS", "METERS", "SPOOLS", "PIECES", "BOXES", "LITERS", "OTHER"}
VALID_CUSTOMER_TYPES = {
    "WHOLESALE_MERCHANT", "BOUTIQUE_BUYER", "DIRECT_RETAIL",
    "EXPORTER", "GOVERNMENT_INSTITUTION", "OTHER"
}


class MasterDataValidationError(Exception):
    pass


class MasterDataValidator:
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict[str, Dict[str, Any]] = {}

        # Cross-reference caches
        self.known_categories: Set[str] = set()
        self.known_suppliers: Set[str] = set()
        self.known_products: Set[str] = set()
        self.known_raw_materials: Set[str] = set()

    def add_error(self, file_name: str, row_idx: int, field: str, message: str):
        self.errors.append(f"[{file_name}:Row {row_idx}] Field '{field}': {message}")

    def add_warning(self, file_name: str, row_idx: int, field: str, message: str):
        self.warnings.append(f"[{file_name}:Row {row_idx}] Field '{field}': {message}")

    def _read_csv(self, file_path: Path) -> List[Dict[str, str]]:
        if not file_path.exists():
            self.errors.append(f"File not found: {file_path.name}")
            return []
        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def validate_categories(self, file_name: str = "category-import-template.csv") -> bool:
        file_path = self.templates_dir / file_name
        rows = self._read_csv(file_path)
        self.stats["categories"] = {"total": len(rows), "valid": 0, "errors": 0}
        if not rows and not file_path.exists():
            return False

        required_cols = {"name", "slug", "description"}
        seen_slugs: Set[str] = set()

        for idx, r in enumerate(rows, start=2):
            row_valid = True
            for col in required_cols:
                if not r.get(col) or not r[col].strip():
                    self.add_error(file_name, idx, col, "Required field is missing or empty")
                    row_valid = False

            slug = r.get("slug", "").strip()
            if slug:
                if not re.match(r"^[a-z0-9-]+$", slug):
                    self.add_error(file_name, idx, "slug", f"Invalid slug format '{slug}' (must be lowercase alphanumeric + hyphens)")
                    row_valid = False
                if slug in seen_slugs:
                    self.add_error(file_name, idx, "slug", f"Duplicate slug '{slug}' in category master")
                    row_valid = False
                else:
                    seen_slugs.add(slug)
                    self.known_categories.add(slug)

            display_order = r.get("display_order", "").strip()
            if display_order:
                try:
                    val = int(display_order)
                    if val < 0:
                        self.add_error(file_name, idx, "display_order", "Must be a non-negative integer")
                        row_valid = False
                except ValueError:
                    self.add_error(file_name, idx, "display_order", f"Invalid integer value '{display_order}'")
                    row_valid = False

            if row_valid:
                self.stats["categories"]["valid"] += 1
            else:
                self.stats["categories"]["errors"] += 1

        return self.stats["categories"]["errors"] == 0

    def validate_suppliers(self, file_name: str = "supplier-import-template.csv") -> bool:
        file_path = self.templates_dir / file_name
        rows = self._read_csv(file_path)
        self.stats["suppliers"] = {"total": len(rows), "valid": 0, "errors": 0}
        if not rows and not file_path.exists():
            return False

        required_cols = {"supplier_code", "supplier_name", "supplier_type", "phone"}
        seen_codes: Set[str] = set()

        for idx, r in enumerate(rows, start=2):
            row_valid = True
            for col in required_cols:
                if not r.get(col) or not r[col].strip():
                    self.add_error(file_name, idx, col, "Required field is missing or empty")
                    row_valid = False

            code = r.get("supplier_code", "").strip()
            if code:
                if code in seen_codes:
                    self.add_error(file_name, idx, "supplier_code", f"Duplicate supplier code '{code}'")
                    row_valid = False
                else:
                    seen_codes.add(code)
                    self.known_suppliers.add(code)

            stype = r.get("supplier_type", "").strip()
            if stype and stype not in VALID_SUPPLIER_TYPES:
                self.add_error(file_name, idx, "supplier_type", f"Invalid supplier type '{stype}'. Allowed: {VALID_SUPPLIER_TYPES}")
                row_valid = False

            phone = r.get("phone", "").strip()
            if phone and not PHONE_REGEX.match(phone):
                self.add_error(file_name, idx, "phone", f"Malformed phone number '{phone}'")
                row_valid = False

            email = r.get("email", "").strip()
            if email and not EMAIL_REGEX.match(email):
                self.add_error(file_name, idx, "email", f"Malformed email address '{email}'")
                row_valid = False

            gstin = r.get("gstin", "").strip()
            if gstin and not GST_REGEX.match(gstin):
                self.add_error(file_name, idx, "gstin", f"Invalid 15-char GSTIN format '{gstin}'")
                row_valid = False

            if row_valid:
                self.stats["suppliers"]["valid"] += 1
            else:
                self.stats["suppliers"]["errors"] += 1

        return self.stats["suppliers"]["errors"] == 0

    def validate_raw_materials(self, file_name: str = "raw-material-import-template.csv") -> bool:
        file_path = self.templates_dir / file_name
        rows = self._read_csv(file_path)
        self.stats["raw_materials"] = {"total": len(rows), "valid": 0, "errors": 0}
        if not rows and not file_path.exists():
            return False

        required_cols = {"material_code", "name", "material_type", "unit_of_measure", "supplier_code", "unit_cost"}
        seen_codes: Set[str] = set()

        for idx, r in enumerate(rows, start=2):
            row_valid = True
            for col in required_cols:
                if not r.get(col) or not r[col].strip():
                    self.add_error(file_name, idx, col, "Required field is missing or empty")
                    row_valid = False

            code = r.get("material_code", "").strip()
            if code:
                if code in seen_codes:
                    self.add_error(file_name, idx, "material_code", f"Duplicate material code '{code}'")
                    row_valid = False
                else:
                    seen_codes.add(code)
                    self.known_raw_materials.add(code)

            mtype = r.get("material_type", "").strip()
            if mtype and mtype not in VALID_MATERIAL_TYPES:
                self.add_error(file_name, idx, "material_type", f"Invalid material type '{mtype}'. Allowed: {VALID_MATERIAL_TYPES}")
                row_valid = False

            uom = r.get("unit_of_measure", "").strip()
            if uom and uom not in VALID_UOM:
                self.add_error(file_name, idx, "unit_of_measure", f"Invalid UOM '{uom}'. Allowed: {VALID_UOM}")
                row_valid = False

            sup_code = r.get("supplier_code", "").strip()
            if sup_code and sup_code not in self.known_suppliers:
                self.add_error(file_name, idx, "supplier_code", f"Foreign key error: Supplier '{sup_code}' not defined in supplier master")
                row_valid = False

            cost_str = r.get("unit_cost", "").strip()
            if cost_str:
                try:
                    cost = Decimal(cost_str)
                    if cost < 0:
                        self.add_error(file_name, idx, "unit_cost", "Unit cost cannot be negative")
                        row_valid = False
                except InvalidOperation:
                    self.add_error(file_name, idx, "unit_cost", f"Invalid decimal value '{cost_str}'")
                    row_valid = False

            reorder_str = r.get("reorder_level", "").strip()
            if reorder_str:
                try:
                    reorder = Decimal(reorder_str)
                    if reorder < 0:
                        self.add_error(file_name, idx, "reorder_level", "Reorder level cannot be negative")
                        row_valid = False
                except InvalidOperation:
                    self.add_error(file_name, idx, "reorder_level", f"Invalid decimal value '{reorder_str}'")
                    row_valid = False

            if row_valid:
                self.stats["raw_materials"]["valid"] += 1
            else:
                self.stats["raw_materials"]["errors"] += 1

        return self.stats["raw_materials"]["errors"] == 0

    def validate_products(self, file_name: str = "product-import-template.csv") -> bool:
        file_path = self.templates_dir / file_name
        rows = self._read_csv(file_path)
        self.stats["products"] = {"total": len(rows), "valid": 0, "errors": 0}
        if not rows and not file_path.exists():
            return False

        required_cols = {"product_code", "name", "category_slug", "retail_price", "wholesale_price"}
        seen_codes: Set[str] = set()

        for idx, r in enumerate(rows, start=2):
            row_valid = True
            for col in required_cols:
                if not r.get(col) or not r[col].strip():
                    self.add_error(file_name, idx, col, "Required field is missing or empty")
                    row_valid = False

            code = r.get("product_code", "").strip()
            if code:
                if code in seen_codes:
                    self.add_error(file_name, idx, "product_code", f"Duplicate product code '{code}'")
                    row_valid = False
                else:
                    seen_codes.add(code)
                    self.known_products.add(code)

            cat_slug = r.get("category_slug", "").strip()
            if cat_slug and cat_slug not in self.known_categories:
                self.add_error(file_name, idx, "category_slug", f"Foreign key error: Category slug '{cat_slug}' not defined in category master")
                row_valid = False

            for price_field in ["retail_price", "wholesale_price"]:
                p_str = r.get(price_field, "").strip()
                if p_str:
                    try:
                        p_val = Decimal(p_str)
                        if p_val <= 0:
                            self.add_error(file_name, idx, price_field, f"Price must be strictly positive (got {p_val})")
                            row_valid = False
                    except InvalidOperation:
                        self.add_error(file_name, idx, price_field, f"Invalid decimal value '{p_str}'")
                        row_valid = False

            gst_rate_str = r.get("gst_rate", "").strip()
            if gst_rate_str:
                try:
                    gst = Decimal(gst_rate_str)
                    if gst < 0 or gst > 100:
                        self.add_error(file_name, idx, "gst_rate", f"GST rate must be between 0 and 100% (got {gst})")
                        row_valid = False
                except InvalidOperation:
                    self.add_error(file_name, idx, "gst_rate", f"Invalid decimal value '{gst_rate_str}'")
                    row_valid = False

            status_str = r.get("availability_status", "").strip()
            if status_str and status_str not in VALID_AVAILABILITY:
                self.add_error(file_name, idx, "availability_status", f"Invalid availability status '{status_str}'. Allowed: {VALID_AVAILABILITY}")
                row_valid = False

            if row_valid:
                self.stats["products"]["valid"] += 1
            else:
                self.stats["products"]["errors"] += 1

        return self.stats["products"]["errors"] == 0

    def validate_customers(self, file_name: str = "customer-import-template.csv") -> bool:
        file_path = self.templates_dir / file_name
        rows = self._read_csv(file_path)
        self.stats["customers"] = {"total": len(rows), "valid": 0, "errors": 0}
        if not rows and not file_path.exists():
            return False

        required_cols = {"full_name", "customer_type", "phone", "city", "state"}
        for idx, r in enumerate(rows, start=2):
            row_valid = True
            for col in required_cols:
                if not r.get(col) or not r[col].strip():
                    self.add_error(file_name, idx, col, "Required field is missing or empty")
                    row_valid = False

            ctype = r.get("customer_type", "").strip()
            if ctype and ctype not in VALID_CUSTOMER_TYPES:
                self.add_error(file_name, idx, "customer_type", f"Invalid customer type '{ctype}'. Allowed: {VALID_CUSTOMER_TYPES}")
                row_valid = False

            phone = r.get("phone", "").strip()
            if phone and not PHONE_REGEX.match(phone):
                self.add_error(file_name, idx, "phone", f"Malformed phone number '{phone}'")
                row_valid = False

            wa = r.get("whatsapp_number", "").strip()
            if wa and not PHONE_REGEX.match(wa):
                self.add_error(file_name, idx, "whatsapp_number", f"Malformed WhatsApp number '{wa}'")
                row_valid = False

            email = r.get("email", "").strip()
            if email and not EMAIL_REGEX.match(email):
                self.add_error(file_name, idx, "email", f"Malformed email address '{email}'")
                row_valid = False

            gstin = r.get("gstin", "").strip()
            if gstin and not GST_REGEX.match(gstin):
                self.add_error(file_name, idx, "gstin", f"Invalid 15-char GSTIN format '{gstin}'")
                row_valid = False

            if row_valid:
                self.stats["customers"]["valid"] += 1
            else:
                self.stats["customers"]["errors"] += 1

        return self.stats["customers"]["errors"] == 0

    def validate_all(self) -> Tuple[bool, Dict[str, Any]]:
        # Validate in dependency order: categories -> suppliers -> raw_materials -> products -> customers
        c_ok = self.validate_categories()
        s_ok = self.validate_suppliers()
        rm_ok = self.validate_raw_materials()
        p_ok = self.validate_products()
        cust_ok = self.validate_customers()

        all_ok = c_ok and s_ok and rm_ok and p_ok and cust_ok and len(self.errors) == 0
        summary = {
            "is_valid": all_ok,
            "stats": self.stats,
            "errors": self.errors,
            "warnings": self.warnings,
        }
        return all_ok, summary


def validate_master_data_directory(dir_path: Path) -> Dict[str, Any]:
    validator = MasterDataValidator(dir_path)
    _, summary = validator.validate_all()
    return summary


def main():
    import argparse
    parser = argparse.ArgumentParser(description="PVS Silk S — CSV Master Data Validator (Dry-Run)")
    parser.add_argument("--templates-dir", type=str, default="templates", help="Path to directory containing CSV templates")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Perform non-destructive dry-run validation")
    args = parser.parse_args()

    target_dir = Path(args.templates_dir)
    if not target_dir.is_absolute():
        target_dir = Path.cwd().parent / args.templates_dir if Path.cwd().name == "backend" else Path.cwd() / args.templates_dir

    print("================================================================================")
    print("           PVS SILK S — CSV MASTER DATA VALIDATOR (DRY-RUN)")
    print(f"Target Directory: {target_dir.resolve()}")
    print("================================================================================")

    if not target_dir.exists():
        print(f"ERROR: Templates directory does not exist: {target_dir}")
        sys.exit(1)

    validator = MasterDataValidator(target_dir)
    is_valid, summary = validator.validate_all()

    print(f"\nDOMAIN VALIDATION SUMMARY:")
    print("-" * 65)
    print(f"{'Domain':<20} | {'Total Rows':<12} | {'Valid Rows':<12} | {'Errors':<8}")
    print("-" * 65)
    for domain, data in summary["stats"].items():
        print(f"{domain:<20} | {data['total']:<12} | {data['valid']:<12} | {data['errors']:<8}")
    print("-" * 65)

    if summary["warnings"]:
        print(f"\nWARNINGS ({len(summary['warnings'])}):")
        for w in summary["warnings"]:
            print(f"  [WARN] {w}")

    if summary["errors"]:
        print(f"\nERRORS ({len(summary['errors'])}):")
        for e in summary["errors"]:
            print(f"  [ERROR] {e}")
        print("\nMASTER DATA VALIDATION RESULT: FAILED")
        sys.exit(1)
    else:
        print("\nMASTER DATA VALIDATION RESULT: ALL TEMPLATES VALID (PASS)")
        sys.exit(0)


if __name__ == "__main__":
    main()
