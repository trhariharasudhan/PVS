# PVS Silk S — CSV Master Data Validation Specification

**Module:** `backend/app/core/validate_master_data.py`  
**Test Suite:** [`backend/app/tests/test_master_data_validation.py`](file:///d:/PVS/backend/app/tests/test_master_data_validation.py)  

---

## 1. Overview

The **CSV Master Data Validator** provides pre-import dry-run validation for all core PVS Silk S catalog and business data templates before importing into database storage.

---

## 2. CLI Usage & Dry-Run Execution

```powershell
& "d:/PVS/backend/.venv/Scripts/python.exe" -m app.core.validate_master_data --dry-run
```

### Options:
- `--templates-dir <path>`: Path to directory containing master CSV files (defaults to `templates/`).
- `--dry-run`: Performs non-destructive in-memory schema, numeric, regex, and relational validation without altering any database state.

---

## 3. Master Data Validation Rules by Domain

### 1. Categories (`category-import-template.csv`)
- **Required Columns:** `name`, `slug`, `description`
- **Validation Rules:**
  - `name` & `slug` must be non-empty strings.
  - `slug` must follow `^[a-z0-9-]+$` format and be unique across the catalog.
  - `display_order` must be a non-negative integer.

### 2. Suppliers (`supplier-import-template.csv`)
- **Required Columns:** `supplier_code`, `supplier_name`, `supplier_type`, `phone`
- **Validation Rules:**
  - `supplier_code` must be unique across all suppliers.
  - `supplier_type` must be one of `['SILK_REELER', 'ZARI_MANUFACTURER', 'DYE_CHEMICALS', 'EQUIPMENT', 'OTHER']`.
  - `phone` must pass international phone regex ($\ge 7$ digits).
  - `email` must pass RFC email format regex.
  - `gstin` must pass 15-character Indian GST format regex (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).

### 3. Raw Materials (`raw-material-import-template.csv`)
- **Required Columns:** `material_code`, `name`, `material_type`, `unit_of_measure`, `supplier_code`, `unit_cost`
- **Validation Rules:**
  - `material_code` must be unique across the inventory.
  - `material_type` must be one of `['RAW_SILK', 'ZARI_GOLD', 'ZARI_SILVER', 'DYE_CHEMICAL', 'COTTON_YARN', 'PACKAGING', 'CONSUMABLE', 'OTHER']`.
  - `unit_of_measure` must be one of `['KILOGRAMS', 'GRAMS', 'METERS', 'SPOOLS', 'PIECES', 'BOXES', 'LITERS', 'OTHER']`.
  - **Foreign Key Check:** `supplier_code` must resolve to an existing supplier in `supplier-import-template.csv`.
  - `unit_cost` and `reorder_level` must be non-negative decimals.

### 4. Saree Products (`product-import-template.csv`)
- **Required Columns:** `product_code`, `name`, `category_slug`, `retail_price`, `wholesale_price`
- **Validation Rules:**
  - `product_code` must be unique across all products.
  - **Foreign Key Check:** `category_slug` must resolve to an existing category in `category-import-template.csv`.
  - `retail_price` and `wholesale_price` must be strictly positive decimals ($> 0$).
  - `gst_rate` must be a valid percentage between $0.0\%$ and $100.0\%$.
  - `availability_status` must be one of `['IN_STOCK', 'MADE_TO_ORDER', 'OUT_OF_STOCK', 'ARCHIVED']`.

### 5. Customers (`customer-import-template.csv`)
- **Required Columns:** `full_name`, `customer_type`, `phone`, `city`, `state`
- **Validation Rules:**
  - `customer_type` must be one of `['WHOLESALE_MERCHANT', 'BOUTIQUE_BUYER', 'DIRECT_RETAIL', 'EXPORTER', 'GOVERNMENT_INSTITUTION', 'OTHER']`.
  - `phone` and `whatsapp_number` must pass international phone regex.
  - `gstin` (if provided) must pass 15-character Indian GST regex.
