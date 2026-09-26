# PVS Silk S — Observability & Logging Policy

## 1. Objectives
This document establishes the observability and logging standard for the PVS Silk S platform, ensuring operational auditability while preventing secret leakage or sensitive customer data exposure.

---

## 2. Redaction & Privacy Invariants

### 2.1 Strictly Forbidden in Application Logs
The following sensitive data items must **NEVER** appear in application logs or exception traces:
1. Plaintext passwords or password reset tokens.
2. JWT access tokens or raw cookie strings (`pvs_access_token`).
3. HTTP `Authorization` headers.
4. Database connection strings containing passwords.
5. Customer or Supplier bank account numbers, credit card tokens, or IFSC credentials.
6. Raw cryptographic secret keys (`SECRET_KEY`).

### 2.2 Allowed Audit Events
The following structured events are logged at `INFO` or `WARNING` level with correlated timestamps:
* **Authentication**: Login successes, failed login attempts (generic reason), logout events.
* **Authorization**: 403 Forbidden attempts (recording User ID and requested endpoint).
* **Inventory**: Stock adjustments (Product ID, delta, movement type, initiator ID).
* **Production**: Batch stage advances, material allocations, batch completion credits.
* **Procurement**: Purchase Order receipts and raw material stock increments.
* **Sales & Invoicing**: Order status changes, invoice generations, payment settlements.

---

## 3. Log Output Format
Logs are emitted to stdout/stderr in standardized format:
```text
[2026-08-30 20:30:15,123] [INFO] [AUTH] Staff login successful: user_id=e7b4... role=SUPER_ADMIN ip=192.168.1.50
[2026-08-30 20:30:45,456] [INFO] [INVENTORY] Stock adjusted: product_code=PVS-KAN-001 delta=+5 type=PRODUCTION_COMPLETION batch=BATCH-101
[2026-08-30 20:31:12,789] [INFO] [INVOICE] Payment recorded: invoice_no=INV-2026-001 amount=35000.00 status=PAID
```
