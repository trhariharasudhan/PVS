# PVS Silk S — Phase 5B-2 Environment Architecture Specification

## 1. Executive Summary
The PVS Silk S full-stack architecture is structured across three distinct environments: **Development**, **Staging**, and **Production**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT                                   │
│  • Local PostgreSQL / In-Memory DB                                       │
│  • Demo fixture seeding enabled (app.db.seed)                           │
│  • Debug mode & API Swagger docs enabled                                │
│  • Localhost CORS allowed                                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Promotion & Testing
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             STAGING                                     │
│  • Isolated cloud Staging PostgreSQL instance                           │
│  • Production-like HTTPS security headers & cookie policies             │
│  • Production-like Next.js build compilation                            │
│  • Smoke test verification & load simulation                            │
│  • Sanitized test datasets only (No production secrets)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Final Release & Verification
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION                                    │
│  • High-availability Managed PostgreSQL 15+                             │
│  • Strict startup validation (Fast-fail on missing secrets / GSTIN)     │
│  • Demo seed execution strictly blocked with hard RuntimeError          │
│  • Production Super Admin created via app.db.init_prod                  │
│  • Verified real PVS Silk S business data only                          │
│  • Swagger docs disabled; CORS restricted to verified domains           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration Matrix

| Configuration Variable | Development | Staging | Production |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | `staging` | `production` |
| `DEBUG` | `true` | `false` | `false` |
| `SECRET_KEY` | Dev default permitted | Random 64-char key | Cryptographically random $\ge 64\text{ char}$ key |
| `DATABASE_URL` | Local PostgreSQL | Staging Managed Cloud DB | Production High-Availability Cluster |
| `CORS_ORIGINS` | `localhost:3000, 127.0.0.1` | `https://staging.pvssilks.com` | `https://pvssilks.com, https://admin.pvssilks.com` |
| `COOKIE_SECURE` | `false` | `true` | `true` |
| `API_DOCS` | Enabled (`/api/v1/docs`) | Enabled / Auth protected | Disabled by default |
| `DEMO_SEED_ALLOWED` | **Yes** | No | **Strictly Forbidden** |
| `BUSINESS_GSTIN` | Placeholder allowed | Placeholder allowed | **Must be valid 15-char Indian GSTIN** |
| `BANK_ACCOUNT_NUMBER` | Placeholder allowed | Placeholder allowed | **Verified Corporate Account** |

---

## 3. Production Readiness Validator Rules
When `ENVIRONMENT=production`, `Settings.validate_production_readiness()` checks:
1. `SECRET_KEY`: Must be $\ge 32$ characters and must not contain `"insecure"`.
2. `DATABASE_URL`: Must not contain `localhost` or `127.0.0.1`.
3. `BUSINESS_GSTIN`: Must match the statutory Indian GSTIN format `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` and not contain `"0000A1Z5"`.
4. `BANK_ACCOUNT_NUMBER`: Must not be empty or contain `"REPLACE"`.
5. `BANK_IFSC`: Must be an exact 11-character Indian Financial System Code.
6. `CORS_ORIGINS`: Must not contain `localhost`, `127.0.0.1`, or wildcard `*`.
