# PVS Silk S — Security Hardening Guide

## 1. Authentication & Session Hardening
* **Argon2id Hasher**: Configured with memory-hard parameters ($64\text{ MB}$ memory cost, $3$ iterations, $4$ parallelism threads).
* **HttpOnly Session Cookies**: Prevents client-side script access via XSS. Configured with `SameSite=lax` (or `strict`) and `Secure=True` in production HTTPS environments.
* **Token Expiration**: Access tokens default to 12 hours (`ACCESS_TOKEN_EXPIRE_MINUTES=720`) for operational efficiency while limiting replay exposure windows.

---

## 2. API & Data Protection Hardening
* **Zero Public Business Leaks**: Public product catalogue APIs (`/api/v1/products`, `/api/v1/categories`) use strict public schemas (`ProductPublicList`, `ProductPublicDetail`) that completely omit:
  * Raw material compositions & suppliers
  * Manufacturing batches and loom assignments
  * Inventory exact piece counts & reorder thresholds
  * Internal production costs and profit margins
* **Bounded Pagination**: All paginated APIs enforce `page >= 1` and `1 <= limit <= 100` via FastAPI `Query(ge=1, le=100)`.
* **UUID Primary Keys**: All database records utilize cryptographic UUIDv4 identifiers, eliminating sequential ID enumeration and IDOR attacks.

---

## 3. Database Transactional Integrity Hardening
* **Pessimistic Row Locking**: Inventory adjustments, material receipts, and invoice payment recording utilize `with_for_update()` to ensure ACID transactional consistency under concurrent operations.
* **Non-Negative Invariants**: Stock deductions and payment allocations validate available quantities prior to persistence, preventing negative inventory or overpayment states.
* **Immutable Movement Ledgers**: `InventoryMovement` and `RawMaterialMovement` records are append-only.

---

## 4. HTTP & Transport Layer Hardening
* **Security Headers Middleware**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), camera=(), microphone=()`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
* **CORS Verb Whitelisting**: Restricted to explicit verbs (`GET, POST, PUT, PATCH, DELETE, OPTIONS`).
