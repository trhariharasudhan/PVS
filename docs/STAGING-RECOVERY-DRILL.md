# PVS Silk S — Staging Database Backup & Disaster Recovery Drill

## 1. Overview
This runbook details the non-production database backup and restoration drill executed in the **Staging** environment to validate point-in-time recovery without risking production operational data.

---

## 2. Staging Recovery Drill Execution Steps

### Step 1: Generate Logical Compressed Backup
From the staging database host, create a point-in-time snapshot:
```bash
pg_dump -h staging-db.internal -U pvs_staging_user -d pvs_silks_staging -Fc -f /backups/staging_drill_$(date +%Y%m%d_%H%M%S).dump
```

### Step 2: Verify Backup File Integrity
```bash
pg_restore -l /backups/staging_drill_*.dump | head -n 30
```
*Verify that table definitions, indexes, sequences, and foreign key constraints are present in the catalog listing.*

### Step 3: Provision Isolated Restore Target
Create a fresh temporary database instance:
```bash
createdb -h staging-db.internal -U pvs_staging_user pvs_silks_restored_drill
```

### Step 4: Restore Snapshot into Isolated Target
```bash
pg_restore -h staging-db.internal -U pvs_staging_user -d pvs_silks_restored_drill --clean --if-exists --no-owner /backups/staging_drill_*.dump
```

### Step 5: Post-Restore Integrity Verification
1. **Migration State Verification:**
   ```bash
   DATABASE_URL=postgresql+asyncpg://pvs_staging_user:password@staging-db.internal/pvs_silks_restored_drill alembic current
   ```
   *Expected Output:* Revision `0003_phase_4c_d_finance_invoicing (head)`.
2. **Entity Consistency Checks:**
   * Verify all 17 core tables exist: `users`, `categories`, `products`, `product_images`, `inventory`, `inventory_movements`, `production_batches`, `production_stages`, `customers`, `orders`, `order_items`, `wholesale_enquiries`, `suppliers`, `raw_materials`, `raw_material_stocks`, `raw_material_movements`, `purchase_orders`, `purchase_items`, `payments`, `invoices`, `invoice_items`.
3. **Application Reconnection:**
   * Point a staging backend instance to `pvs_silks_restored_drill` and hit `/ready`.
   * Verify HTTP 200 OK with `{"status":"ok","database":"connected"}`.

### Step 6: Teardown
```bash
dropdb -h staging-db.internal -U pvs_staging_user pvs_silks_restored_drill
```

---

## 3. SLA Targets
* **Target RPO (Recovery Point Objective)**: $\le 15\text{ minutes}$.
* **Target RTO (Recovery Time Objective)**: $\le 30\text{ minutes}$.
