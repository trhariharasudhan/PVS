# PVS Silk S — Raw Material Inventory & Movement Ledger

## 1. Overview & Business Invariants

Authentic silk saree manufacturing relies on expensive raw inputs (Grade 2A+ Mulberry silk, 24K gold-plated pure silver zari threads). Strict raw material accounting prevents pilferage, ensures quality traceability, and enables accurate cost-of-goods calculation.

### 1.1 Non-Negative Stock Invariant
Raw material stock on hand can **never be negative** under any circumstance. All decrement operations (production batch consumption, damage write-offs, vendor returns) must verify that `quantity_available >= requested_deduction` with row-level PostgreSQL locks before applying the change.

### 1.2 Immutable Append-Only Ledger
Direct overwrites to inventory quantities without an audit trail are strictly prohibited. **Every stock adjustment** generates an immutable `RawMaterialMovement` ledger record with timestamp, operator ID, delta amount, and reference code.

---

## 2. Data Models Architecture

### 2.1 Raw Material Specification (`raw_materials`)
* `id` (UUID, PK)
* `material_code` (VARCHAR(50), UNIQUE, e.g. `RM-SILK-2A`)
* `name` (VARCHAR(255), e.g. `Mulberry Raw Silk Yarn 2A Grade`)
* `material_type` (`RAW_SILK`, `PURE_ZARI`, `METALLIC_ZARI`, `ECO_DYES`, `PACKAGING_SUPPLIES`, `LOOM_ACCESSORIES`)
* `unit_of_measure` (`KILOGRAMS`, `GRAMS`, `METERS`, `HANK_REELS`, `UNITS`)
* `reorder_level` (NUMERIC(10,2), default 10.00)
* `unit_cost` (NUMERIC(10,2), optional standard cost rate)
* `supplier_id` (UUID, FK `suppliers.id`, optional default supplier)
* `is_active` (BOOLEAN)

### 2.2 Live Stock Tracking (`raw_material_stock`)
* `id` (UUID, PK)
* `raw_material_id` (UUID, FK `raw_materials.id`, UNIQUE)
* `quantity_on_hand` (NUMERIC(12,2), non-negative physical stock)
* `quantity_reserved` (NUMERIC(12,2), allocated to active batches)
* `warehouse_location` (VARCHAR(100), e.g. `Yarn Bay 1 - Bin A`)
* `last_restocked_at` (TIMESTAMPTZ)
* `updated_at` (TIMESTAMPTZ)

### 2.3 Immutable Movement Ledger (`raw_material_movements`)
* `id` (UUID, PK)
* `raw_material_id` (UUID, FK `raw_materials.id`)
* `movement_type` (`PURCHASE_RECEIPT`, `PRODUCTION_CONSUMPTION`, `ADJUSTMENT`, `WASTAGE_DAMAGE`, `RETURN_TO_SUPPLIER`)
* `quantity_delta` (NUMERIC(12,2), positive or negative change)
* `reference_id` (VARCHAR(100), e.g. `PO-10023`, `BATCH-PVS-101`, `AUDIT-2026-Q3`)
* `performed_by_user_id` (UUID, FK `users.id`)
* `notes` (TEXT, explanation / QA rationale)
* `created_at` (TIMESTAMPTZ)

---

## 3. Stock Status Determination

| Stock Condition | Status Tag | Operational Action |
| :--- | :--- | :--- |
| `quantity_on_hand == 0` | `OUT_OF_STOCK` | Immediate procurement order required |
| `quantity_on_hand <= reorder_level` | `LOW_STOCK` | Reorder warning highlighted on dashboard |
| `quantity_on_hand > reorder_level` | `IN_STOCK` | Normal production available |

---

## 4. API Reference

* `GET /api/v1/admin/raw-materials` — List materials with search, material type filter, and low-stock filter.
* `GET /api/v1/admin/raw-materials/{id}` — Detail of material, current stock, and recent movements ledger.
* `POST /api/v1/admin/raw-materials` — Create raw material SKU and initialize warehouse baseline stock.
* `PATCH /api/v1/admin/raw-materials/{id}` — Update reorder levels, cost rate, or active status.
* `POST /api/v1/admin/raw-materials/{id}/adjust` — Perform row-locked stock adjustment with append-only ledger entry.
