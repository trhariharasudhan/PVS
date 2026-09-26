# PVS Silk S — Production Deployment Runbook

## 1. Prerequisites Checklist
Before triggering a production deployment:
* [ ] Verified managed PostgreSQL 15+ database instance provisioned.
* [ ] Production domain DNS configured (`pvssilks.com`, `api.pvssilks.com`, `admin.pvssilks.com`).
* [ ] SSL/TLS Certificates generated via Let's Encrypt / Cloudflare Edge.
* [ ] All proprietary PVS Silk S business environment variables collected from management (Verified GSTIN, Bank account, initial Super Admin password).
* [ ] All 85+ backend tests and Next.js frontend production builds passing.

---

## 2. Step-by-Step Production Deployment Sequence

### Step 1: Database Migration Execution
Ensure `DATABASE_URL` is set to the production PostgreSQL connection string and run migrations:
```bash
cd backend
alembic upgrade head
alembic current
```
*Verify output shows current revision matches latest migration head (`0003_phase_4c_d_finance_invoicing`).*

---

### Step 2: Initialize Production Super Admin Account
Execute the safe production admin creation script:
```bash
cd backend
python app/db/init_prod.py
```
*Verify output:* `[INIT-PROD SUCCESS] Super Admin created successfully: admin@pvssilks.com`.
*(Note: This script NEVER injects fake products, orders, or suppliers).*

---

### Step 3: Launch FastAPI Production Backend
Launch backend with production Uvicorn/Gunicorn workers behind a process supervisor (systemd / Docker):
```bash
cd backend
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8000 \
  --access-logfile - \
  --error-logfile -
```

---

### Step 4: Build and Launch Next.js Production Frontend
```bash
cd /path/to/PVS
npm run build
npm run start -- -p 3000
```

---

### Step 5: Post-Deployment Smoke Verification
1. Test Health Endpoint:
   ```bash
   curl -I https://api.pvssilks.com/health
   ```
   *Expected:* `HTTP/1.1 200 OK` with JSON `{"status":"ok","environment":"production","database":"connected"}`.
2. Verify Admin Login:
   * Navigate to `https://pvssilks.com/admin/login`.
   * Log in with initial Super Admin credentials.
   * Verify dashboard loads with 0 records (clean production slate).
3. Import Real Master Data:
   * Import verified categories, products, suppliers, raw materials, and customer records using the templates in `templates/`.

---

## 3. Rollback Procedure
If a critical runtime error occurs post-deployment:
1. Revert application code to previous Git release tag.
2. If database rollback is necessary:
   ```bash
   cd backend
   alembic downgrade -1
   ```
3. Restart backend and frontend application processes.
