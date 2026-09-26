# PVS Silk S — Staging Deployment & Operations Runbook

**Environment:** Staging Cluster (`docker-compose.staging.yml`)  
**Target:** QA, UAT, and Business Stakeholder Verification  

---

## 1. Staging Stack Deployment Sequence

### Step 1: Environment File Setup
Ensure staging environment configuration files are prepared:
```bash
cp backend/.env.staging.example backend/.env.staging
cp .env.staging.example .env.staging
```

### Step 2: Build & Start Staging Services
```bash
docker-compose -f docker-compose.staging.yml --env-file backend/.env.staging up -d --build
```

### Step 3: Execute Database Migrations
Run Alembic upgrade inside the running backend container:
```bash
docker exec -t pvs_staging_backend alembic upgrade head
```

### Step 4: Verify Migration Head & Health Probes
```bash
# Verify migration revision
docker exec -t pvs_staging_backend alembic current
# Expected: 0003_phase_4c_d_finance_invoicing (head)

# Liveness probe
curl -f http://localhost:8000/health
# Expected: HTTP 200 {"status": "healthy", "version": "1.0.0"}

# Readiness probe (verifies PostgreSQL connection)
curl -f http://localhost:8000/ready
# Expected: HTTP 200 {"status": "ready", "database": "connected"}
```

---

## 2. Initial Super Admin Bootstrap (Staging)

Provision the initial staging Super Admin without injecting demo data:
```bash
docker exec -t pvs_staging_backend python -m app.db.init_prod
```
- Creates `staging-admin@pvssilks.test` with role `SUPER_ADMIN`.

---

## 3. Staging Reset & Clean Tear Down

To reset staging to a pristine clean state:
```bash
docker-compose -f docker-compose.staging.yml down -v
```
Re-run steps 1–4 to re-initialize from scratch.
