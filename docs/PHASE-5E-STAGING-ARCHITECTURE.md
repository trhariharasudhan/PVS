# PVS Silk S — Phase 5E Staging Environment Architecture Specification

**Phase:** 5E — Staging Deployment & Business Acceptance Testing  
**Environment:** Staging Verification Cluster (`staging.pvssilks.com`)  
**Isolation Level:** Complete Air-Gap Separation from Production Infrastructure  

---

## 1. Staging Topology & Network Isolation

The staging environment faithfully mirrors the production multi-tier topology while operating on independent database instances, isolated networks, and mock business configurations:

```
                      [ QA Engineers / Business Stakeholders / UAT Testers ]
                                                 │
                                                 ▼
                                     [ Staging Edge Ingress ]
                                                 │
                                 (HTTPS :443 / Self-Signed or Staging TLS)
                                                 ▼
                                   [ Nginx Staging Reverse Proxy ]
                                                 │
                          ┌──────────────────────┴──────────────────────┐
                          │ Host / Path Routing                         │
                          ▼                                             ▼
          [ staging.pvssilks.com ]                            [ staging-api.pvssilks.com ]
                          │                                             │
                          ▼                                             ▼
          ┌───────────────────────────┐                 ┌───────────────────────────┐
          │ Next.js Staging Frontend  │                 │ FastAPI Staging Backend   │
          │ (Node.js 20 Standalone)   │ ──(REST API)──► │ (Python 3.12 ASGI)        │
          │ Port: 3000 (Non-root)     │                 │ Port: 8000 (Non-root)     │
          └───────────────────────────┘                 └─────────────┬─────────────┘
                                                                      │
                                                (AsyncPG Internal Network Bridge)
                                                                      ▼
                                                        ┌───────────────────────────┐
                                                        │ Staging PostgreSQL 15     │
                                                        │ Database: pvs_staging_db  │
                                                        │ Port: 5432                │
                                                        └───────────────────────────┘
```

---

## 2. Staging Configuration & Air-Gap Invariants

| Configuration Key | Staging Value / Behavior | Production Contrast |
|---|---|---|
| `ENVIRONMENT` | `staging` | `production` |
| `DEBUG` | `false` | `false` |
| `SECRET_KEY` | Dedicated 64-char hex key (`openssl rand -hex 32`) | Production secret vault key |
| `DATABASE_URL` | `postgresql+asyncpg://pvs_stg_user:***@staging-db:5432/pvs_silks_staging` | Managed Cloud RDS Production Instance |
| `CORS_ORIGINS` | `https://staging.pvssilks.com,https://staging-admin.pvssilks.com` | Strict live domains `pvssilks.com` |
| `BUSINESS_GSTIN` | Verified format placeholder: `33AAAAA1111A1Z1` | Official registered GSTIN |
| `BANK_ACCOUNT_NUMBER`| Staging test account: `9999888877770001` | Official corporate current account |
| `BANK_IFSC` | Verified IFSC format: `SBIN0000853` | Live SBI corporate branch IFSC |
| `INVOICE_PREFIX` | `PVS/STG/2026-27/` | `PVS/INV/2026-27/` |
| `ADMIN_INITIAL_EMAIL`| `staging-admin@pvssilks.test` | Official operations email |

---

## 3. Staging Persistence & Data Integrity

- **Database Volume:** `pvs_staging_db_data` (isolated from any production backups or volumes).
- **Disposable Architecture:** Entire staging database can be wiped and re-migrated via Alembic (`0001` -> `0002` -> `0003`) at any time without impacting production assets.
- **Seeding Guard:** `seed.py` is enabled in development/staging for synthetic test datasets, but permanently guarded by `assert settings.ENVIRONMENT != "production"`.
