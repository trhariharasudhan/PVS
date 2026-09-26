# PVS Silk S — Loom Production Operations Specification

**Module:** Master Loom Production Batches & Checkpoints Timeline  
**Phase:** Phase 4C-A  
**Last Updated:** August 30, 2026  

---

## 1. Overview & Business Objective

PVS Silk S is a traditional silk saree manufacturer utilizing authentic handloom weaving stations (including Jacquard Korvai looms). The production module manages weaving runs, tracks quality inspection stages, and coordinates the hand-off between weaving completion and finished warehouse inventory.

---

## 2. Production Batch & Stage Models

* **`production_batches` table:**
  - `id` (UUIDv4 Primary Key)
  - `batch_number` (Unique Varchar, e.g. `PVS-BATCH-105`)
  - `product_id` (UUIDv4 Foreign Key $\rightarrow$ `products.id` with `RESTRICT`)
  - `loom_identifier` (Varchar, e.g. "Master Korvai Loom 04")
  - `planned_quantity` (Integer, planned sarees to weave)
  - `completed_quantity` (Integer, finished approved sarees)
  - `status` (Enum: `PLANNED`, `WARPING`, `WEAVING_IN_PROGRESS`, `FINISHING`, `QUALITY_CHECK`, `COMPLETED`, `ABORTED`)
  - `start_date` / `estimated_completion_date` (Date)
  - `created_at` / `updated_at` (Timestamp with timezone)

* **`production_stages` table (Configurable Quality Checkpoints):**
  - `id` (UUIDv4 Primary Key)
  - `batch_id` (UUIDv4 Foreign Key $\rightarrow$ `production_batches.id` with `CASCADE`)
  - `stage_sequence` (Integer, order of execution)
  - `stage_name` (Varchar, configurable checkpoint name)
  - `status` (Enum: `PENDING`, `IN_PROGRESS`, `PASSED_QC`, `FAILED_REWORK`)
  - `inspected_by` (Varchar, name/ID of master weaver or QC inspector)
  - `notes` (Text, specific silk quality remarks)
  - `completed_at` (Timestamp with timezone)

---

## 3. Extensible Silk Weaving Stage Architecture

> [!NOTE]
> The exact stages in handloom silk manufacturing can vary by weave complexity (e.g. Korvai interlocking vs. Brocade Jacquard). Rather than hard-coding rigid assumptions, the stage system is fully extensible and configurable.

Default Development Checkpoints:
1. `1. Raw Mulberry Silk & Pure Zari Testing` (Material inspection)
2. `2. Jacquard Loom Card Punching & Setting` (Design calibration)
3. `3. Warp Preparation & Bobbin Sizing` (Loom setup)
4. `4. Master Loom Interlocking Weave (Korvai)` (Handloom weaving)
5. `5. Quality Control & Traditional Edge Finishing` (Final inspection)

---

## 4. Production $\rightarrow$ Inventory Integration & Idempotency

When a production run is finished, transitioning the batch status to `COMPLETED` automatically executes the following atomic business integration:

```
                      ┌─────────────────────────────────┐
                      │    Production Batch COMPLETED   │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │  Check Idempotency: Has Batch   │
                      │  Been Credited to Inventory?    │
                      └───────┬─────────────────┬───────┘
                              │ No              │ Yes (Already Credited)
                              ▼                 ▼
          ┌───────────────────────────┐   ┌───────────────────────────┐
          │ Execute Atomic Stock Tx:  │   │ Preserve Status; Do NOT   │
          │ 1. Increment Inventory    │   │ Duplicate Inventory Delta │
          │ 2. Append PRODUCTION Mov  │   └───────────────────────────┘
          │    (Ref: BATCH-XXXX)      │
          └───────────────────────────┘
```

1. **Idempotency Guarantee:**
   - The backend checks for any existing `InventoryMovement` with `reference_id = f"BATCH-{batch.batch_number}"` and `movement_type = "PRODUCTION"`.
   - Repeated updates to an already completed batch will **never** duplicate inventory additions.
2. **Atomic Consistency:**
   - The stock addition and the movement ledger recording are committed in a single database transaction.
