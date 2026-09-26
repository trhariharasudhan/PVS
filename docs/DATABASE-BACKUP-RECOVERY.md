# PVS Silk S — Database Backup, Migration & Disaster Recovery Specification

## 1. Overview
This document outlines the standard operational procedures for database management, backup routines, migration execution, and disaster recovery for the PVS Silk S PostgreSQL transactional database.

---

## 2. Backup Strategy

### 2.1 Logical Backups (`pg_dump`)
* **Frequency:** Daily automated cron backup at 02:00 IST.
* **Format:** PostgreSQL custom compressed archive (`-Fc`).
* **Command:**
  ```bash
  pg_dump -h <host> -U <user> -d pvs_silks_production -Fc -f /backups/pvs_silks_$(date +%Y%m%d_%H%M%S).dump
  ```
* **Retention Policy:**
  * Daily backups retained for 30 days.
  * Weekly full backups retained for 12 weeks.
  * Monthly archive snapshots retained for 12 months.

### 2.2 Point-In-Time Recovery (PITR) / Physical WAL Archiving
* **Status:** `RECOMMENDED` for managed production deployments (e.g., AWS RDS PostgreSQL or DigitalOcean Managed Databases).
* **Target RPO (Recovery Point Objective):** $\le 5\text{ minutes}$.
* **Target RTO (Recovery Time Objective):** $\le 30\text{ minutes}$.

---

## 3. Database Migration Execution (`alembic`)

### 3.1 Migration Forward (Production Deployment)
1. Verify database connectivity:
   ```bash
   alembic current
   ```
2. Execute pending migrations:
   ```bash
   alembic upgrade head
   ```
3. Verify successful revision state.

### 3.2 Rollback Strategy
1. Identify previous stable revision:
   ```bash
   alembic history
   ```
2. Revert exactly one revision:
   ```bash
   alembic downgrade -1
   ```
3. Or revert to explicit revision hash:
   ```bash
   alembic downgrade <revision_id>
   ```

---

## 4. Disaster Recovery & Restoration Procedure

### 4.1 Restoring from Custom Dump
1. Create a clean database target:
   ```bash
   createdb -h <host> -U <user> pvs_silks_restored
   ```
2. Restore database objects and data:
   ```bash
   pg_restore -h <host> -U <user> -d pvs_silks_restored --clean --if-exists --no-owner /backups/<dump_file>.dump
   ```
3. Run post-restore sanity checks:
   * Verify total table counts across users, categories, products, inventory, orders, invoices, and payments.
   * Check latest migration revision with `alembic current`.

---

## 5. Implementation State Summary

| Disaster Recovery Component | Status | Mechanism |
| :--- | :--- | :--- |
| **Alembic Versioned Migrations** | `IMPLEMENTED` | Linear revision chain in `backend/alembic/versions` |
| **Development Seed Isolation** | `IMPLEMENTED` | Guarded in `backend/app/db/seed.py` |
| **Production Initializer** | `IMPLEMENTED` | Clean admin setup via `backend/app/db/init_prod.py` |
| **Automated Cloud Snapshots** | `RECOMMENDED` | Provider-level RDS / Managed DB snapshots |
| **Off-site Backup Storage** | `RECOMMENDED` | S3 / GCS bucket with immutable object lock |
