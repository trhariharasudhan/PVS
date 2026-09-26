# PVS Silk S — Inventory Operations Specification

**Module:** Finished Saree Inventory & Movement Ledger  
**Phase:** Phase 4C-A  
**Last Updated:** August 30, 2026  

---

## 1. Overview & Business Objective

In a traditional silk saree manufacturing and wholesale business, physical stock accuracy is financial and operational ground truth. The PVS Silk S inventory layer tracks finished saree stock quantities, safe threshold alerts, and maintains an immutable, append-only chronological audit ledger (`inventory_movements`) of all physical stock delta adjustments.

---

## 2. Data Model & Entity Structure

The inventory system is built directly on the PostgreSQL 16 relational core:

* **`inventory` table:**
  - `id` (UUIDv4 Primary Key)
  - `product_id` (UUIDv4 Unique Foreign Key $\rightarrow$ `products.id` with `CASCADE` delete)
  - `quantity_on_hand` (Integer $\ge 0$)
  - `quantity_reserved` (Integer $\ge 0$, allocated for confirmed wholesale/retail orders)
  - `reorder_threshold` (Integer, default 5 units for low-stock warnings)
  - `warehouse_location` (Varchar, e.g. "Central Godown — Aisle 3")
  - `updated_at` (Timestamp with timezone)

* **`inventory_movements` table (Immutable Ledger):**
  - `id` (UUIDv4 Primary Key)
  - `inventory_id` (UUIDv4 Foreign Key $\rightarrow$ `inventory.id` with `RESTRICT`)
  - `movement_type` (Enum: `PURCHASE`, `PRODUCTION`, `SALE`, `ADJUSTMENT`, `DAMAGE`, `RETURN`)
  - `quantity_delta` (Integer, positive for stock addition, negative for stock reduction)
  - `reference_id` (Varchar, PO number, Batch SKU e.g. `BATCH-PVS-001`, or Invoice ID)
  - `performed_by_user_id` (UUIDv4 Foreign Key $\rightarrow$ `users.id` with `SET NULL`)
  - `notes` (Text, audit notes & reason for change)
  - `created_at` (Timestamp with timezone)

---

## 3. Stock Adjustment Rules & Invariants

1. **Non-Negative Stock Invariant:**
   - Physical stock cannot drop below zero (`quantity_on_hand + delta >= 0`).
   - If an adjustment or sale attempts to reduce stock below zero, the backend raises an explicit `409 Conflict` ("Insufficient stock for product. Current stock: X, Requested delta: Y").
2. **Atomic Ledger Invariant:**
   - Every modification to `inventory.quantity_on_hand` **MUST** be accompanied by an `InventoryMovement` within the same database transaction.
   - If movement creation fails or validation fails, the entire transaction is rolled back.
3. **Concurrency & Race Condition Protection:**
   - Stock adjustments execute with row-level locking (`SELECT ... FOR UPDATE OF inventory`) in PostgreSQL.
   - Concurrent staff adjustments evaluate sequentially, ensuring deterministic ledger balances.
4. **Append-Only Immutability:**
   - Movement ledger records cannot be edited or deleted by staff. Corrections are made via compensatory adjustments (e.g. `ADJUSTMENT` movement).

---

## 4. Movement Types

| Movement Type | Typical Sign | Description |
|---|---|---|
| `PURCHASE` | `+` (Positive) | Direct yarn/fabric procurement or finished saree stock acquisition. |
| `PRODUCTION` | `+` (Positive) | Completed weaving run from a master handloom. |
| `RETURN` | `+` (Positive) | Customer or boutique trade return returned to active stock. |
| `ADJUSTMENT` | `+/-` (Any) | Periodic physical inventory count reconciliation. |
| `DAMAGE` | `-` (Negative) | Weaving flaws, zari tarnishing, water damage, or QC scrap. |
| `SALE` | `-` (Negative) | Direct store sale, exhibition sale, or dispatched wholesale order. |

---

## 5. API Endpoints

* `GET /api/v1/admin/inventory` — Paginated list with search, category, stock status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), and low-stock filters.
* `GET /api/v1/admin/inventory/{product_id}` — Inventory counts and recent movements for a saree SKU.
* `POST /api/v1/admin/inventory/{product_id}/adjust` — Atomic stock adjustment with ledger logging.
* `GET /api/v1/admin/inventory/{product_id}/movements` — Full chronological audit history.
