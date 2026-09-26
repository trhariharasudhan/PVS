import os
import csv
import re
import sys
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum

from app.core.catalogue_media_validator import CatalogueMediaValidator, MediaStatus

VALID_AVAILABILITY_STATUSES = {"IN_STOCK", "MADE_TO_ORDER", "LIMITED_WEAVE", "BULK_AVAILABLE", "OUT_OF_STOCK"}
VALID_FABRIC_TYPES = {
    "pure silk", "pure mulberry silk", "kanchipuram silk", "soft silk",
    "silk cotton", "organza silk", "tussar silk", "raw silk"
}
VALID_CATEGORY_SLUGS = {
    "bridal", "traditional", "contemporary", "muhurtham",
    "party-wear", "cotton-silk", "soft-silk", "festival"
}

KNOWN_PLACEHOLDERS = {
    "dummy", "test", "sample", "example", "localhost", "fake", "placeholder", "demo"
}

REQUIRED_CSV_HEADERS = [
    "product_code",
    "name",
    "category_slug",
    "fabric",
    "color",
    "border",
    "pallu",
    "motif",
    "weave_type",
    "description",
    "dimensions",
    "weight",
    "retail_price",
    "wholesale_price",
    "gst_rate",
    "availability_status",
    "is_featured",
    "is_active",
]


class CatalogueStatus(str, Enum):
    CATALOGUE_READY = "CATALOGUE_READY"
    CATALOGUE_PENDING_MEDIA = "CATALOGUE_PENDING_MEDIA"
    CATALOGUE_PENDING_BUSINESS_DATA = "CATALOGUE_PENDING_BUSINESS_DATA"
    CATALOGUE_INVALID = "CATALOGUE_INVALID"
    CATALOGUE_BLOCKED = "CATALOGUE_BLOCKED"


class CatalogueIngestionValidator:
    """
    PVS Silk S — Master Saree Catalogue & Photography Ingestion Validator (Phase 5L-03).
    Deterministic, fail-closed validation engine for real saree SKU inventory,
    Kanchipuram textile specifications, 5% GST tax billing invariants,
    and associated high-resolution photoshoot assets.
    """
    def __init__(self, templates_dir: Optional[Path] = None, media_validator: Optional[CatalogueMediaValidator] = None):
        if templates_dir is None:
            self.templates_dir = Path(__file__).resolve().parent.parent.parent.parent / "templates"
        else:
            self.templates_dir = templates_dir
        self.media_validator = media_validator or CatalogueMediaValidator()
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_csv_structure(self, file_path: Path) -> Tuple[bool, List[Dict[str, str]], List[str]]:
        """Validate CSV file existence, headers, encoding, and row formatting."""
        if not file_path.exists():
            return False, [], [f"Catalogue CSV file not found: '{file_path.name}'"]

        try:
            with open(file_path, "r", encoding="utf-8-sig") as f:
                reader = csv.reader(f)
                headers = next(reader, None)
                if not headers:
                    return False, [], ["CSV file is completely empty."]

                # Check missing or duplicate headers
                header_set = set()
                duplicate_headers = []
                for h in headers:
                    h_clean = h.strip()
                    if h_clean in header_set:
                        duplicate_headers.append(h_clean)
                    header_set.add(h_clean)

                if duplicate_headers:
                    return False, [], [f"Duplicate headers in CSV: {duplicate_headers}"]

                missing_headers = [h for h in REQUIRED_CSV_HEADERS if h not in header_set]
                if missing_headers:
                    return False, [], [f"Missing required CSV columns: {missing_headers}"]

                # Read remaining rows as dicts
                f.seek(0)
                dict_reader = csv.DictReader(f)
                rows = [row for row in dict_reader if any(v.strip() for v in row.values() if v)]
                return True, rows, []
        except Exception as e:
            return False, [], [f"CSV parsing failure in '{file_path.name}': {str(e)}"]

    def validate_saree_row(self, row: Dict[str, str], row_idx: int, seen_skus: Set[str]) -> Dict[str, Any]:
        """Validate individual saree SKU record against textile, pricing, and tax invariants."""
        errors = []
        warnings = []

        sku = (row.get("product_code") or "").strip()
        name = (row.get("name") or "").strip()
        cat_slug = (row.get("category_slug") or "").strip().lower()
        fabric = (row.get("fabric") or "").strip()
        color = (row.get("color") or "").strip()
        border = (row.get("border") or "").strip()
        pallu = (row.get("pallu") or "").strip()
        motif = (row.get("motif") or "").strip()
        weave_type = (row.get("weave_type") or "").strip()
        description = (row.get("description") or "").strip()
        retail_price_str = (row.get("retail_price") or "").strip()
        wholesale_price_str = (row.get("wholesale_price") or "").strip()
        gst_rate_str = (row.get("gst_rate") or "").strip()
        status_str = (row.get("availability_status") or "").strip()

        # 1. SKU Integrity
        if not sku:
            errors.append(f"Row {row_idx}: Missing or empty 'product_code' (SKU).")
        elif sku in seen_skus:
            errors.append(f"Row {row_idx}: Duplicate SKU '{sku}'.")
        elif any(p in sku.lower() for p in KNOWN_PLACEHOLDERS):
            errors.append(f"Row {row_idx}: SKU '{sku}' contains forbidden placeholder token.")
        else:
            seen_skus.add(sku)

        # 2. Product Name
        if not name:
            errors.append(f"Row {row_idx}: Missing product name.")
        elif len(name) < 5:
            errors.append(f"Row {row_idx}: Product name '{name}' is too short (<5 characters).")
        elif any(p in name.lower() for p in ["dummy", "sample product", "test saree"]):
            errors.append(f"Row {row_idx}: Product name '{name}' is a test/placeholder.")

        # 3. Category
        if not cat_slug:
            errors.append(f"Row {row_idx}: Missing 'category_slug'.")
        elif cat_slug not in VALID_CATEGORY_SLUGS:
            warnings.append(f"Row {row_idx}: Category slug '{cat_slug}' not in standard silk taxonomy: {sorted(list(VALID_CATEGORY_SLUGS))}.")

        # 4. Textile Specifications
        if not fabric:
            errors.append(f"Row {row_idx}: Missing 'fabric' specification.")
        elif not any(f in fabric.lower() for f in VALID_FABRIC_TYPES):
            warnings.append(f"Row {row_idx}: Fabric '{fabric}' is outside traditional pure silk classifications.")

        if not color:
            errors.append(f"Row {row_idx}: Missing 'color' description.")
        if not border:
            errors.append(f"Row {row_idx}: Missing 'border' description.")
        if not weave_type:
            errors.append(f"Row {row_idx}: Missing 'weave_type' description.")
        if not description or len(description) < 15:
            errors.append(f"Row {row_idx}: Saree description is missing or too short (<15 characters).")

        # 5. Pricing & Tax Invariants
        try:
            retail_price = Decimal(retail_price_str)
            if retail_price <= 0:
                errors.append(f"Row {row_idx}: Retail price ({retail_price}) must be positive.")
        except (InvalidOperation, TypeError):
            errors.append(f"Row {row_idx}: Invalid numeric retail price '{retail_price_str}'.")
            retail_price = Decimal("0")

        try:
            wholesale_price = Decimal(wholesale_price_str)
            if wholesale_price <= 0:
                errors.append(f"Row {row_idx}: Wholesale price ({wholesale_price}) must be positive.")
            elif retail_price > 0 and wholesale_price > retail_price:
                errors.append(f"Row {row_idx}: Wholesale price ({wholesale_price}) cannot exceed retail price ({retail_price}).")
        except (InvalidOperation, TypeError):
            errors.append(f"Row {row_idx}: Invalid numeric wholesale price '{wholesale_price_str}'.")

        # 6. GST 5% Invariant
        try:
            gst_rate = float(gst_rate_str)
            if gst_rate != 5.0:
                errors.append(f"Row {row_idx}: GST rate {gst_rate}% violates pure silk handloom statutory rate (5.0%).")
        except (ValueError, TypeError):
            errors.append(f"Row {row_idx}: Invalid numeric GST rate '{gst_rate_str}'.")

        # 7. Availability Status
        if status_str not in VALID_AVAILABILITY_STATUSES:
            errors.append(f"Row {row_idx}: Invalid availability status '{status_str}'. Allowed: {VALID_AVAILABILITY_STATUSES}.")

        return {
            "sku": sku,
            "name": name,
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    def validate_catalogue_file(
        self,
        csv_file_path: Optional[Path] = None,
        media_records: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Validate complete catalogue CSV file and cross-check photography coverage."""
        file_path = csv_file_path or (self.templates_dir / "product-import-template.csv")
        success, rows, struct_errors = self.validate_csv_structure(file_path)

        if not success:
            return {
                "phase": "5L-03",
                "component": "catalogue_ingestion_validator",
                "file_analyzed": str(file_path.name),
                "status": CatalogueStatus.CATALOGUE_INVALID.value,
                "is_production_ready": False,
                "summary": {
                    "total_rows": 0,
                    "valid_rows": 0,
                    "error_rows": 0,
                    "total_errors": len(struct_errors),
                },
                "errors": struct_errors,
                "media_coverage": None,
                "verdict": "CATALOGUE CSV STRUCTURE INVALID",
            }

        seen_skus: Set[str] = set()
        row_results = []
        all_errors = []
        all_warnings = []

        for idx, r in enumerate(rows, start=2):
            res = self.validate_saree_row(r, idx, seen_skus)
            row_results.append(res)
            all_errors.extend(res["errors"])
            all_warnings.extend(res["warnings"])

        valid_rows = sum(1 for r in row_results if r["is_valid"])
        error_rows = len(row_results) - valid_rows

        # Media coverage inspection
        media_res = self.media_validator.validate_media_manifest(
            products=rows,
            media_records=media_records,
            is_external_cdn=True
        )

        # Fail-closed classification
        if error_rows > 0:
            status = CatalogueStatus.CATALOGUE_INVALID.value
            is_ready = False
            verdict = f"CATALOGUE CONTAINS {error_rows} INVALID ROW(S)"
        elif not media_res["is_ready"]:
            status = CatalogueStatus.CATALOGUE_PENDING_MEDIA.value
            is_ready = False
            verdict = "SAREE CATALOGUE VALIDATED — AUTHENTIC PHOTOGRAPHY ASSETS PENDING"
        elif len(rows) == 0:
            status = CatalogueStatus.CATALOGUE_PENDING_BUSINESS_DATA.value
            is_ready = False
            verdict = "CATALOGUE CSV CONTAINS ZERO RECORDS"
        else:
            status = CatalogueStatus.CATALOGUE_READY.value
            is_ready = True
            verdict = "CATALOGUE & MEDIA ASSETS PRODUCTION READY"

        return {
            "phase": "5L-03",
            "component": "catalogue_ingestion_validator",
            "file_analyzed": str(file_path.name),
            "status": status,
            "fail_closed": True,
            "is_production_ready": is_ready,
            "summary": {
                "total_rows": len(rows),
                "valid_rows": valid_rows,
                "error_rows": error_rows,
                "total_errors": len(all_errors),
                "total_warnings": len(all_warnings),
            },
            "media_coverage": media_res,
            "errors": all_errors[:20],
            "warnings": all_warnings[:20],
            "verdict": verdict,
        }


# TupleResult type helper for internal parsing
TupleResult = Any


def main():
    import argparse
    parser = argparse.ArgumentParser(description="PVS Silk S — Catalogue & Media Ingestion Validator (Phase 5L-03)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Execute dry-run inspection")
    parser.add_argument("--csv-path", type=str, help="Custom path to catalogue CSV")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON format")
    args = parser.parse_args()

    csv_path = Path(args.csv_path) if args.csv_path else None
    validator = CatalogueIngestionValidator()
    report = validator.validate_catalogue_file(csv_file_path=csv_path)

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print("==================================================================================")
    print("      PVS SILK S — SAREE CATALOGUE & MEDIA INGESTION VALIDATOR (PHASE 5L-03)")
    print("==================================================================================")
    s = report["summary"]
    print(f"\nCATALOGUE SUMMARY (Fail-Closed: True):")
    print(f"  • File Analyzed:       {report['file_analyzed']}")
    print(f"  • Status:              {report['status']}")
    print(f"  • Total SKU Rows:      {s['total_rows']}")
    print(f"  • Valid Rows:          {s['valid_rows']}")
    print(f"  • Error Rows:          {s['error_rows']}")
    print(f"  • Total Errors:        {s['total_errors']}")
    print(f"  • Production Ready:    {report['is_production_ready']}")
    print("-" * 88)
    m = report.get("media_coverage") or {}
    print(f"PHOTOGRAPHY COVERAGE:")
    print(f"  • Total Products:      {m.get('total_products', 0)}")
    print(f"  • Products with Media: {m.get('products_with_images', 0)}")
    print(f"  • Products Missing:    {m.get('products_missing_images', 0)}")
    print(f"  • Coverage Percentage: {m.get('coverage_pct', 0.0)}%")
    print(f"  • Media Status:        {m.get('status', 'N/A')}")
    print("-" * 88)
    print(f"\nFINAL VERDICT: {report['verdict']}")
    print("==================================================================================")


if __name__ == "__main__":
    main()
