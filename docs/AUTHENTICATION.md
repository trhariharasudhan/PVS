# PVS Silk S — Authentication & Role-Based Access Control (RBAC) Specification
**Document Version:** 1.0.0  
**Phase:** Phase 4A — Admin Authentication & Authorization Foundation  
**Framework:** FastAPI / Argon2id / PyJWT / HttpOnly Cookies / Next.js  
**Last Updated:** August 30, 2026  

---

## 1. Authentication Objective & Overview

The PVS Silk S platform employs a hardened, browser-safe authentication architecture specifically tailored for internal staff (administrators, loom managers, and sales representatives). 

Public user registration is intentionally omitted; staff accounts are provisioned exclusively through authorized administrative channels or the secure CLI provisioning tool.

---

## 2. Password Security & Hashing Architecture

- **Algorithm:** Memory-hard **Argon2id** (via `argon2-cffi`), with fallback support for modern Bcrypt hashes.
- **Parameters:**
  - `time_cost`: 3 iterations
  - `memory_cost`: 65536 KiB (64 MB)
  - `parallelism`: 4 threads
  - `salt_len`: 16 bytes
  - `hash_len`: 32 bytes
- **Security Guarantees:**
  - Passwords are **never** stored in plaintext.
  - Passwords and password hashes are strictly excluded from API response schemas, logs, tracebacks, and error envelopes.
  - Verification failures return generic `401 Unauthorized` responses without disclosing whether an email exists, neutralizing user-enumeration attacks.

---

## 3. Session & Cookie Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS ADMIN CLIENT                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/v1/auth/login
                               │ (email, password)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI AUTH SERVICE                    │
│   1. Validates credentials with Argon2id                    │
│   2. Creates short-lived signed JWT (sub: UUID, role)       │
│   3. Returns 'Set-Cookie' header with HttpOnly token        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Set-Cookie: pvs_access_token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER COOKIE JAR                      │
│   • HttpOnly: True (Inaccessible to client JavaScript/XSS)  │
│   • Secure: True in Production (HTTPS Only)                 │
│   • SameSite: Lax (Protects against CSRF attacks)           │
│   • Path: /                                                 │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **No LocalStorage Tokens:** Authentication tokens are never stored in browser `localStorage`, `sessionStorage`, or window global variables. The browser automatically includes the HttpOnly cookie on authenticated requests (`credentials: "include"`).

---

## 4. Role-Based Access Control (RBAC) & Initial Permission Matrix

The system implements centralized RBAC dependencies (`require_authenticated_user`, `require_role(UserRole)`).

### 4.1 Role Hierarchy & Capabilities

| Role | Scope | Permissions |
|---|---|---|
| `SUPER_ADMIN` | Global System Administration | Full access across catalogue CMS, loom production, inventory, wholesale CRM, orders, and staff accounts. |
| `FACTORY_MANAGER` | Loom & Manufacturing | Full access to loom weaving batches, 7-stage checkpoints, raw silk/zari inventory, and read access to catalogue. |
| `SALES_ADMIN` | Commercial & Trade CRM | Full access to wholesale B2B inquiries, customer accounts, orders, catalogue management, and pricing notes. |
| `DEALER` | Future B2B Showroom Portal | Reserved for future authenticated wholesale portal (disabled in admin platform). |

### 4.2 Reusable Authorization Dependencies

```python
# Reusable FastAPI dependencies
from app.api.deps import require_authenticated_user, require_role
from app.models.user import UserRole

# Require any authenticated staff member
@router.get("/admin/profile")
async def profile(user: User = Depends(require_authenticated_user)): ...

# Restrict to Factory Managers and Super Admins
@router.post("/admin/production/batch")
async def schedule_batch(user: User = Depends(require_role(UserRole.FACTORY_MANAGER))): ...

# Restrict to Sales Admins and Super Admins
@router.get("/admin/wholesale/leads")
async def view_leads(user: User = Depends(require_role(UserRole.SALES_ADMIN))): ...
```

---

## 5. Environment Variables

| Variable | Default (Dev) | Description |
|---|---|---|
| `SECRET_KEY` | `pvs-silks-insecure-secret-...` | High-entropy signing key for JWT session tokens (Override in production). |
| `JWT_ALGORITHM` | `HS256` | JWT cryptographic signature algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` (12 Hours) | Session token lifespan. |
| `AUTH_COOKIE_NAME` | `pvs_access_token` | Name of the HttpOnly session cookie. |
| `COOKIE_SECURE` | `False` (`True` in Prod) | Requires HTTPS when `True`. |
| `COOKIE_SAMESITE` | `lax` | Cross-site request policy (`lax` or `strict`). |
| `ADMIN_EMAIL` | `admin@pvssilks.local` | Target email for CLI provisioning. |
| `ADMIN_PASSWORD` | `None` (Prompted securely) | Provisioning password (never commit to Git). |

---

## 6. Super Admin Provisioning CLI

To create or reset an administrative account in PostgreSQL:

```bash
# Navigate to backend directory
cd backend

# Interactive secure prompt (password hidden during typing)
python -m app.db.create_admin --email "admin@pvssilks.com" --name "PVS Administrator"

# Automated CI / Docker environment deployment
ADMIN_EMAIL="admin@pvssilks.com" ADMIN_PASSWORD="SecureProductionPass2026!" python -m app.db.create_admin
```

---

## 7. Audit Logging Preparation (Phase 4B+ Roadmap)

The following administrative actions are designated for immutable audit logging in future phases:
1. `AUTH_LOGIN` / `AUTH_LOGOUT`: Timestamp, staff ID, IP address, user-agent.
2. `PRODUCT_CREATE` / `PRODUCT_UPDATE` / `PRODUCT_ARCHIVE`: Saree code, field diffs, author.
3. `INVENTORY_ADJUST`: Delta quantity, reason code, reference batch/order ID.
4. `ORDER_STATUS_CHANGE`: Previous status, new status, payment reference.
5. `PRODUCTION_STAGE_ADVANCE`: Batch ID, stage sequence, inspector name, timestamp.
6. `STAFF_ROLE_CHANGE`: Target user ID, old role, new role, updated by.
