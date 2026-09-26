# PVS Silk S — Phase 6-03: Payment Gateway Webhook Ingestion & Auto-Reconciliation

**Phase:** 6-03 — Payment Gateway Webhook Ingestion & Auto-Reconciliation  
**Migration:** [`backend/alembic/versions/0005_phase_6_03_payment_webhook_events.py`](file:///d:/PVS/backend/alembic/versions/0005_phase_6_03_payment_webhook_events.py)  
**Webhook Security Module:** [`backend/app/core/webhook_security.py`](file:///d:/PVS/backend/app/core/webhook_security.py)  
**Webhook Service:** [`backend/app/services/payment_webhook_service.py`](file:///d:/PVS/backend/app/services/payment_webhook_service.py)  
**API Endpoints:** [`backend/app/api/v1/endpoints/webhooks.py`](file:///d:/PVS/backend/app/api/v1/endpoints/webhooks.py)  
**Focused Test Suite:** [`backend/app/tests/test_payment_webhooks.py`](file:///d:/PVS/backend/app/tests/test_payment_webhooks.py) `(5/5 PASS)`  
**Full Test Suite:** `228 / 228 Tests Passing (100%) across 35 test modules`  
**Status:** **PHASE 6-03 COMPLETE — FAIL-CLOSED PRODUCTION LOCK INTACT**  

---

> [!IMPORTANT]
> **GOVERNANCE & PROVIDER SELECTION BOUNDARY:**  
> **Phase 6-03 implements a provider-neutral payment webhook ingestion and auto-reconciliation foundation.**  
> - Real gateway selection (Razorpay, Cashfree, or SBI ePay) remains a commercial business decision.  
> - No fake gateway credentials, merchant IDs, webhook secrets, or unprovisioned payment routes were created.  
> - **Subsequent subphases (Phase 6-04 Transactional Communications, Phase 6-05 Certification) are NOT implemented.**  
> - Production cutover remains strictly **`LOCKED`** and fail-closed.

---

## 1. Objective & Scope

Phase 6-03 establishes a resilient, cryptographically verified, and provider-neutral webhook ingestion pipeline for processing asynchronous settlement notifications from payment gateways:
1. **Additive Webhook Event Persistence:** `payment_webhook_events` table with database-enforced idempotency (`UNIQUE(provider, event_id)`).
2. **Provider-Neutral Signature Verification:** Constant-time HMAC-SHA256 signature verification preventing timing attacks, secret leaks, and unauthorized payloads.
3. **Webhook Ingestion Endpoint:** Public receiver at `POST /api/v1/webhooks/payments/{gateway}` accepting raw payload bytes and signature headers.
4. **Automated Transactional Reconciliation:** Maps verified payment events to open tax invoices, validates amounts and currencies (INR), applies `Payment` records, updates invoice balances, transitions invoice and order statuses, and writes immutable audit logs.
5. **Idempotency & Concurrency Safety:** Guarantees that duplicate or concurrent webhook delivery results in at most one payment application.

---

## 2. Architecture & Pipeline

```
+---------------------------------------------------------------------------------------------------+
|                                  PAYMENT GATEWAY WEBHOOK PIPELINE                                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
                      [ POST /api/v1/webhooks/payments/{gateway} ]
                                                  |
                                                  v
                     [ 1. Cryptographic HMAC-SHA256 Signature Verification ]
                     (Constant-time comparison; reject missing/invalid signature with 401)
                                                  |
                                                  v
                     [ 2. Database Idempotency Check & Event Persistence ]
                     (Check UNIQUE(provider, event_id) in payment_webhook_events)
                     +----------------------------+----------------------------+
                     | If Duplicate (Already Seen)| If New Event               |
                     v                            v                            |
          [ Return 200 OK (Duplicate) ]  [ Persist PaymentWebhookEvent (PENDING) ]
                                                  |
                                                  v
                              [ 3. Payment Reconciliation Engine ]
                              - Locate authoritative Tax Invoice (by UUID/Invoice Number)
                              - Lock Invoice row (SELECT ... FOR UPDATE)
                              - Validate Currency == 'INR'
                              - Validate Payment Amount <= Invoice Balance Due (Reject Overpayment)
                              - Create Payment Record (Status: CLEARED)
                              - invoice.paid_amount += Amount
                              - invoice.balance_due -= Amount
                              - If balance_due == 0: invoice.status = PAID, order.payment_status = FULLY_PAID
                              - Update WebhookEventStatus -> PROCESSED
                              - Emit Audit Log: PAYMENT_CLEARED_VIA_WEBHOOK
```

---

## 3. Database Schema Updates (Migration `0005`)

### Table: `payment_webhook_events`
- `id`: `UUID` primary key.
- `provider`: `String(50)` indexed (e.g. `generic`, `razorpay`, `cashfree`, `sbi_epay`).
- `event_id`: `String(150)` indexed (external gateway transaction/event identifier).
- `event_type`: `String(100)` indexed (e.g. `payment.captured`, `payment.success`, `order.paid`).
- `status`: `String(50)` indexed (`PENDING`, `PROCESSED`, `DUPLICATE`, `IGNORED`, `FAILED`).
- `payload`: `JSON` (full raw webhook payload).
- `signature_verified`: `Boolean` (default `False`).
- `processed_at`: `DateTime(timezone=True)` nullable.
- `error_message`: `Text` nullable.
- `retry_count`: `Integer` default `0`.
- `created_at`, `updated_at`: `DateTime(timezone=True)`.
- `UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event_id")`.

---

## 4. Security & Idempotency Invariants

1. **Constant-Time Verification:** `hmac.compare_digest` prevents side-channel timing attacks.
2. **Zero Secret Exposure:** Signing keys are read dynamically from `WEBHOOK_SECRET_<GATEWAY>` environment variables. Raw keys are never logged, echoed, or included in responses.
3. **Database Uniqueness:** The database unique constraint on `(provider, event_id)` guarantees duplicate webhooks cannot create duplicate event records.
4. **Row-Level Locking:** During reconciliation, `Invoice` and `Order` rows are locked with `FOR UPDATE` to serialize concurrent webhook deliveries.
5. **Overpayment & Currency Defense:** Reconciler rejects currency mismatches (non-INR) or amounts exceeding invoice `balance_due`.

---

## 5. Verification & Test Evidence

### A. Focused Phase 6-03 Tests (`5 / 5 PASS`):
- `test_valid_webhook_ingestion_and_reconciliation_lifecycle` $\rightarrow$ `PASSED`
- `test_invalid_and_missing_signature_rejected` $\rightarrow$ `PASSED`
- `test_idempotent_duplicate_event_handling` $\rightarrow$ `PASSED`
- `test_overpayment_and_currency_mismatch_rejected` $\rightarrow$ `PASSED`
- `test_admin_webhook_events_listing` $\rightarrow$ `PASSED`

$$\mathbf{Focused\ Tests:\quad 5\ /\ 5\ PASS\ (100.0\%)}$$

### B. Full Backend Pytest Suite:
$$\mathbf{Full\ Backend\ Tests:\quad 228\ /\ 228\ PASS\ (100.0\%\ across\ 35\ test\ modules)}$$

### C. Migration Single-Head Linear Chain:
$$\mathbf{0001\ \rightarrow\ 0002\ \rightarrow\ 0003\ \rightarrow\ 0004\ \rightarrow\ 0005\ (100\%\ PASS)}$$

---

## 6. Production Safety & Remaining Scope

- **Provider Selection:** Pending commercial business selection of payment aggregator (Razorpay, Cashfree, SBI ePay).
- **Phase 6-04 (Transactional Email & WhatsApp Dispatch Pipeline):** NOT IMPLEMENTED.
- **Phase 6-05 (E2E Regression, Security Audit & Certification):** NOT IMPLEMENTED.
- **Production Status:** Strictly **`LOCKED`** (0/9 External Prerequisites Satisfied — 9 BLOCKED).
