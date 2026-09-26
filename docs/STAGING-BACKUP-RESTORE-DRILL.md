# PVS Silk S — Staging Database Backup & Restore Drill Runbook

**Environment:** Staging Disposable Cluster  
**Purpose:** Verify point-in-time PostgreSQL backup, container reset, and data restoration integrity.

---

## 1. Prerequisites

Ensure the Staging cluster is active via Docker Compose:
```bash
docker-compose -f docker-compose.staging.yml up -d
```

---

## 2. Backup Execution Drill

### Step 1: Populate Representative Staging Data
Ensure staging database contains master data, raw material stocks, production batches, orders, and invoices.

### Step 2: Perform Logical PostgreSQL Backup
Execute `pg_dump` inside the running `staging-db` container:
```bash
# Generate custom format archive
docker exec -t pvs_staging_db pg_dump -U pvs_staging_user -Fc pvs_silks_staging > /backups/pvs_staging_backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup file size and integrity
ls -lh /backups/pvs_staging_backup_*.dump
```

---

## 3. Disaster Simulation & Database Reset

### Step 3: Terminate Staging Database Connections
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'pvs_silks_staging' AND pid <> pg_backend_pid();
```

### Step 4: Drop and Recreate Disposable Database
```bash
docker exec -i pvs_staging_db psql -U pvs_staging_user -d postgres -c "DROP DATABASE pvs_silks_staging;"
docker exec -i pvs_staging_db psql -U pvs_staging_user -d postgres -c "CREATE DATABASE pvs_silks_staging OWNER pvs_staging_user;"
```

---

## 4. Restoration Drill

### Step 5: Restore Database from Dump Archive
```bash
docker exec -i pvs_staging_db pg_restore -U pvs_staging_user -d pvs_silks_staging --clean --if-exists /backups/pvs_staging_backup_<TIMESTAMP>.dump
```

### Step 6: Verify Database Integrity & Record Counts
Run verification queries:
```sql
SELECT 'users' AS table_name, count(*) FROM users
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'inventory', count(*) FROM inventory
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'invoices', count(*) FROM invoices
UNION ALL
SELECT 'payments', count(*) FROM payments;
```

### Step 7: Validate Application Reconnection
Execute the readiness probe to confirm live database connectivity:
```bash
curl -i http://localhost:8000/api/v1/ready
# Expected: HTTP 200 OK {"status": "ready", "database": "connected"}
```
