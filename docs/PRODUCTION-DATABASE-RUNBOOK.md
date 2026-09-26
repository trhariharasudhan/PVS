# PVS Silk S — Production Database Operations & Migration Runbook

**Scope:** Schema Migrations, Connection Pool Management, Rollback Procedures, and Transaction Safety  
**Target:** Managed PostgreSQL 15+  

---

## 1. Migration Protocol (Zero-Downtime Pipeline)

All schema changes must follow this strict 5-stage protocol:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Pre-Backup   │ ──► │ 2. Apply Alembic│ ──► │ 3. Health Probe │ ──► │ 4. Verification │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │ (On Failure)
                                                         ▼
                                                ┌─────────────────┐
                                                │ 5. Auto-Rollback│
                                                └─────────────────┘
```

---

## 2. Step-by-Step Execution Sequence

### Step 1: Pre-Migration Snapshot / Logical Backup
Before running any migration, take an atomic logical snapshot:
```bash
docker exec -t pvs_prod_db pg_dump -U pvs_prod_user -Fc pvs_silks_production > /backups/pre_migration_$(date +%Y%m%d_%H%M%S).dump
```

### Step 2: Execute Alembic Migration
Run migration inside the production backend container:
```bash
docker exec -t pvs_prod_backend alembic upgrade head
```

### Step 3: Migration Verification
Verify that the database revision matches the expected target head:
```bash
docker exec -t pvs_prod_backend alembic current
# Expected Output: 0003_phase_4c_d_finance_invoicing (head)
```

### Step 4: Validate Database Readiness
Confirm database read/write responsiveness:
```bash
curl -f -i https://api.pvssilks.com/ready
# Expected: HTTP 200 OK {"status": "ready", "database": "connected"}
```

---

## 3. Rollback & Disaster Recovery Procedures

### Scenario A: Clean Alembic Downgrade (Schema Rollback)
If the migration fails or introduces an application bug, roll back one revision:
```bash
docker exec -t pvs_prod_backend alembic downgrade -1
```

### Scenario B: Emergency Snapshot Restoration
If the schema is corrupted or data is inconsistent, restore from the pre-migration dump:
```bash
# 1. Terminate active application connections
docker exec -i pvs_prod_db psql -U pvs_prod_user -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'pvs_silks_production' AND pid <> pg_backend_pid();"

# 2. Restore database
docker exec -i pvs_prod_db pg_restore -U pvs_prod_user -d pvs_silks_production --clean --if-exists /backups/pre_migration_<TIMESTAMP>.dump

# 3. Verify health
docker exec -t pvs_prod_backend alembic current
```

---

## 4. Connection Pool & Timeout Configurations

- **SQLAlchemy Pool Size:** `20` base connections per container instance.
- **Max Overflow:** `10` burst connections.
- **Connection Recycle:** `1800` seconds (prevents stale TCP connections).
- **Pre-Ping (`pool_pre_ping=True`):** Tests connection liveness before checking out from pool.
- **Statement Timeout:** `30s` (prevents runaway long-running queries from blocking the pool).
