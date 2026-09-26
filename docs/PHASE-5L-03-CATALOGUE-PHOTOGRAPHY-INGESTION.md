# PVS Silk S — Phase 5L-03: Master Saree Catalogue & Photography Ingestion Validator

**Phase:** 5L-03 — Master Saree Catalogue & Photography Ingestion Validator  
**Modules:**  
- [`backend/app/core/catalogue_ingestion_validator.py`](file:///d:/PVS/backend/app/core/catalogue_ingestion_validator.py)  
- [`backend/app/core/catalogue_media_validator.py`](file:///d:/PVS/backend/app/core/catalogue_media_validator.py)  
**Test Suite:** [`backend/app/tests/test_catalogue_ingestion_validator.py`](file:///d:/PVS/backend/app/tests/test_catalogue_ingestion_validator.py) `(11/11 PASS)`  
**Status:** **CATALOGUE VALIDATOR ACTIVE (FAIL-CLOSED: TRUE) — AUTHENTIC DATA ONBOARDING PENDING**  

---

> [!IMPORTANT]
> **SAFETY & ZERO-FABRICATION POLICY:**  
> Phase 5L-03 establishes a deterministic, fail-closed validation framework for authentic saree inventory CSVs and photography assets.  
> **Phase 5L-03 does not invent fake product records, mock catalogue photos, insert unverified inventory into the database, or deploy publicly.**

---

## 1. Objective & Scope

Phase 5L-03 provides automated, auditable validation for real **PVS Silk S** master saree catalogue data and associated media assets. When merchandising and creative teams supply live SKU lists and photoshoot assets, the ingestion engine deterministically checks structural integrity, textile attributes, pricing invariants, statutory 5% GST tax rules, and media coverage before production importation.

---

## 2. Ingestion Architecture & Invariants

```
               [ Master Saree Catalogue CSV ]
                             |
       +---------------------+---------------------+
       |                                           |
[ Saree Textile Specifications ]        [ Commercial Pricing & Tax ]
• Pure Mulberry / Kanchipuram Silk      • Positive Retail & Wholesale Price
• Korvai / Traditional Handloom Weave   • Wholesale <= Retail Price
• Contrast Zari Border & Pallu          • Strictly 5.0% Handloom GST Rate
• Traditional Motifs (Mayil, etc.)      • Valid Availability Status
• Dimensions (6.2m) & Weight (750-850g)
       |                                           |
       +---------------------+---------------------+
                             |
              [ Photography Asset Manifest ]
              • Valid Extensions (.jpg, .jpeg, .png, .webp)
              • Anti-Traversal Protection (No ../, no absolute path leaks)
              • Anti-Executable Defense (No .php, .exe, .sh, .py)
              • SKU Naming Pattern: {SKU}_{tag}.jpg
              • 100% SKU Media Coverage Required
                             |
             [ All Rows & Media 100% Valid ? ]
                     /               \
                 (Yes)               (No)
                  /                     \
      [ CATALOGUE_READY ]      [ FAIL-CLOSED: PENDING_MEDIA / INVALID ]
```

---

## 3. Validation Rules

### A. Master Saree SKU & Textile Invariants
- **SKU Integrity:** Must be non-empty, unique, alphanumeric + hyphens (e.g. `PVS-BRIDAL-001`). Rejects placeholder tokens (`DEMO`, `TEST`, `SAMPLE`, `DUMMY`).
- **Product Name:** Non-empty, minimum 5 characters.
- **Fabric Type:** Validated against pure silk textile classifications (`Pure Mulberry Silk`, `Kanchipuram Silk`, `Soft Silk`, `Silk Cotton`, `Organza Silk`).
- **Weave & Construction:** Traditional handloom weaves (`Korvai Handloom Weave`, `Traditional Handloom`, `Petni Weave`).
- **Motifs & Aesthetics:** Traditional South Indian motifs (`Mayil / Peacock`, `Rudraksha`, `Yali`, `Mango / Paisley`, `Floral Jaal`).
- **Dimensions & Weight:** Saree length (e.g. `6.2 meters with blouse`), approximate weight (`750 grams` to `850 grams`).

### B. Pricing & Statutory Tax Invariants
- **Retail Price:** Must be strictly positive numeric value.
- **Wholesale Price:** Must be positive and $\le$ `retail_price`.
- **GST Rate:** Must strictly equal `5.0` (matching the invoice system's statutory handloom pure silk tax rate).

### C. Photography & Media Manifest Invariants
- **Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Security Protections:** Rejects path traversal (`../`, `..\\`) and prohibited executable extensions (`.php`, `.exe`, `.sh`, `.js`, `.py`).
- **Standard Asset Tags:** `front`, `back`, `border`, `pallu`, `detail`, `lifestyle`, `primary`.
- **Media Coverage Metric:** Calculates percentage of catalogue SKUs with at least 1 verified photography asset. Unless coverage is 100%, readiness is fail-closed (`CATALOGUE_PENDING_MEDIA`).

---

## 4. CLI Commands & Deterministic Output

### CLI Execution
```powershell
python -m app.core.catalogue_ingestion_validator --dry-run
```

```powershell
python -m app.core.catalogue_ingestion_validator --json
```

```powershell
python -m app.core.catalogue_ingestion_validator --csv-path templates/product-import-template.csv
```

### Dry-Run JSON Contract (Fail-Closed Default State)
```json
{
  "phase": "5L-03",
  "component": "catalogue_ingestion_validator",
  "file_analyzed": "product-import-template.csv",
  "status": "CATALOGUE_PENDING_MEDIA",
  "fail_closed": true,
  "is_production_ready": false,
  "summary": {
    "total_rows": 2,
    "valid_rows": 2,
    "error_rows": 0,
    "total_errors": 0,
    "total_warnings": 0
  },
  "media_coverage": {
    "status": "PENDING_EXTERNAL_MEDIA",
    "total_products": 2,
    "products_with_images": 0,
    "products_missing_images": 2,
    "coverage_pct": 0.0,
    "duplicate_count": 0,
    "invalid_count": 0,
    "invalid_details": [],
    "duplicate_details": [],
    "is_ready": false
  },
  "errors": [],
  "warnings": [],
  "verdict": "SAREE CATALOGUE VALIDATED — AUTHENTIC PHOTOGRAPHY ASSETS PENDING"
}
```

---

## 5. Automated Test Coverage

The validator is verified by [`backend/app/tests/test_catalogue_ingestion_validator.py`](file:///d:/PVS/backend/app/tests/test_catalogue_ingestion_validator.py) with 11 test cases:
1. `test_valid_catalogue_row`
2. `test_missing_or_duplicate_sku`
3. `test_placeholder_sku_rejected`
4. `test_missing_product_name_or_too_short`
5. `test_invalid_prices_and_wholesale_exceeding_retail`
6. `test_gst_rate_must_be_5_percent`
7. `test_csv_structure_validation_with_temp_file`
8. `test_media_validator_single_image`
9. `test_media_coverage_manifest_calculation`
10. `test_catalogue_full_file_validation_with_media`
11. `test_deterministic_json_output`

---

## 6. Next Phase

**Phase 5L-04** will implement the **Infrastructure & Environment Production Contract Validator**, providing dry-run verification for managed PostgreSQL cloud cluster parameters and secrets manager (KMS/Vault) injection once provisioned.
