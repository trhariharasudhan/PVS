# PVS Silk S — Phase 6-04: Transactional Communications Engine

**Phase:** 6-04 — Transactional Communications Engine  
**Migration:** [`backend/alembic/versions/0006_phase_6_04_communication_events.py`](file:///d:/PVS/backend/alembic/versions/0006_phase_6_04_communication_events.py)  
**Adapters Module:** [`backend/app/core/communication_adapters.py`](file:///d:/PVS/backend/app/core/communication_adapters.py)  
**Dispatcher Service:** [`backend/app/services/communication_service.py`](file:///d:/PVS/backend/app/services/communication_service.py)  
**API Endpoints:** [`backend/app/api/v1/endpoints/communications.py`](file:///d:/PVS/backend/app/api/v1/endpoints/communications.py)  
**Focused Test Suite:** [`backend/app/tests/test_transactional_communications.py`](file:///d:/PVS/backend/app/tests/test_transactional_communications.py) `(4/4 PASS)`  
**Full Backend Test Suite:** `232 / 232 Tests Passing (100%) across 36 test modules`  
**Status:** **PHASE 6-04 COMPLETE — FAIL-CLOSED PRODUCTION LOCK INTACT**  

---

> [!IMPORTANT]
> **GOVERNANCE & PROVIDER SELECTION BOUNDARY:**  
> **Phase 6-04 implements a provider-neutral transactional communication foundation.**  
> - Real communication providers (AWS SES / SendGrid for Email; Meta Cloud API / Gupshup for WhatsApp) have not yet been commercially selected.  
> - No fake credentials, test WhatsApp numbers, or unverified SMTP servers were configured.  
> - Dry-run / simulation deliveries are explicitly classified as `SIMULATED_DRY_RUN` and never masqueraded as real deliveries.  
> - **Subsequent subphase (Phase 6-05 E2E Regression, Security Audit & Certification) is NOT implemented.**  
> - Production cutover remains strictly **`LOCKED`** and fail-closed.

---

## 1. Objective & Scope

Phase 6-04 establishes a multi-channel, provider-neutral transactional communication engine for PVS Silk S:
1. **Additive Communication Event Persistence:** `communication_events` table tracking all domain notifications with database-enforced idempotency (`UNIQUE(idempotency_key)`).
2. **Channel Abstraction:** `BaseChannelAdapter`, `NeutralEmailAdapter`, and `NeutralWhatsAppAdapter` supporting clean pluggability for future cloud providers.
3. **Dynamic GST PDF Generation:** Seamless reuse of the ReportLab invoice generation utility to attach generated Tax Invoice PDFs in-memory without temporary file leaks.
4. **Server-Authoritative Templates:** All message bodies, totals, and recipient details are rendered strictly from server-side database records.
5. **Bounded Retry Policy:** Bounded retry mechanism with terminal `FAILED` states to prevent infinite loop storms.
6. **Auditability & Correlation:** Preserves `correlation_id` across notification dispatches and writes immutable business audit records (`TRANSACTIONAL_COMMUNICATION`).

---

## 2. Architecture & Pipeline

```
+---------------------------------------------------------------------------------------------------+
|                            TRANSACTIONAL COMMUNICATIONS PIPELINE                                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
                     [ Domain Event Trigger (Order / Invoice / Payment) ]
                                                  |
                                                  v
                     [ 1. Server-Authoritative Data Hydration & Rendering ]
                     - Hydrate Order, Invoice, Customer, and Payment records
                     - Calculate totals, GST breakdowns, and generate in-memory PDF
                     - Construct Idempotency Key: {event_type}:{channel}:{id}:{recipient}
                                                  |
                                                  v
                     [ 2. Database Idempotency Check & Outbox Persistence ]
                     (Check UNIQUE(idempotency_key) in communication_events)
                     +----------------------------+----------------------------+
                     | If Duplicate Key Found     | If New Event               |
                     v                            v                            |
          [ Return Existing Event Record ]     [ Invoke Channel Adapters ]     |
                                                  |                            |
                                      +-----------+-----------+                |
                                      |                       |                |
                                      v                       v                |
                           [ Email Adapter ]        [ WhatsApp Adapter ]       |
                           - RFC 5322 regex         - E.164 phone validation   |
                           - In-memory PDF attach   - Template parameters      |
                           - Dry-run simulation     - Dry-run simulation       |
                                      |                       |                |
                                      +-----------+-----------+                |
                                                  |                            |
                                                  v                            |
                                 [ 3. Status & Audit Recording ]               |
                                 - Status: SIMULATED_DRY_RUN / SENT            |
                                 - Record attempt count & provider message ID  |
                                 - Emit Audit Log: TRANSACTIONAL_COMMUNICATION |
```

---

## 3. Database Schema Updates (Migration `0006`)

### Table: `communication_events`
- `id`: `UUID` primary key.
- `event_type`: `String(50)` indexed (`ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_DISPATCHED`, `ORDER_DELIVERED`, `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `INVOICE_ISSUED`, `INVOICE_PAID`, `DEALER_ACCOUNT_CREATED`, `DEALER_ACCOUNT_APPROVED`).
- `channel`: `String(30)` indexed (`EMAIL`, `WHATSAPP`, `SMS`).
- `provider`: `String(50)` indexed (default `neutral_stub`).
- `recipient`: `String(255)` indexed (email address or E.164 phone number).
- `status`: `String(50)` indexed (`QUEUED`, `SIMULATED_DRY_RUN`, `SENT`, `DELIVERED`, `FAILED`).
- `order_id`: `UUID` nullable FK -> `orders.id`.
- `invoice_id`: `UUID` nullable FK -> `invoices.id`.
- `customer_id`: `UUID` nullable FK -> `customers.id`.
- `user_id`: `UUID` nullable FK -> `users.id`.
- `subject`: `String(255)` nullable.
- `rendered_content`: `Text` (server-rendered notification body).
- `attachments_metadata`: `JSON` nullable (PDF filename, content type, size in bytes).
- `idempotency_key`: `String(255)` unique indexed.
- `attempt_count`: `Integer` default `0`.
- `max_attempts`: `Integer` default `3`.
- `sent_at`, `delivered_at`: `DateTime(timezone=True)` nullable.
- `error_message`: `Text` nullable.
- `provider_message_id`: `String(150)` nullable.
- `correlation_id`: `String(100)` nullable.
- `created_at`, `updated_at`: `DateTime(timezone=True)`.

---

## 4. Verification & Test Evidence

### A. Focused Phase 6-04 Tests (`4 / 4 PASS`):
- `test_order_and_invoice_communication_dispatch_lifecycle` $\rightarrow$ `PASSED`
- `test_communication_idempotency_prevents_duplicate_dispatch` $\rightarrow$ `PASSED`
- `test_invalid_recipient_and_retry_bounded_policy` $\rightarrow$ `PASSED`
- `test_admin_communication_events_api` $\rightarrow$ `PASSED`

$$\mathbf{Focused\ Tests:\quad 4\ /\ 4\ PASS\ (100.0\%)}$$

### B. Full Backend Pytest Suite:
$$\mathbf{Full\ Backend\ Tests:\quad 232\ /\ 232\ PASS\ (100.0\%\ across\ 36\ test\ modules)}$$

### C. Migration Single-Head Linear Chain:
$$\mathbf{0001\ \rightarrow\ 0002\ \rightarrow\ 0003\ \rightarrow\ 0004\ \rightarrow\ 0005\ \rightarrow\ 0006\ (100\%\ PASS)}$$

---

## 5. Production Safety & Remaining Scope

- **Provider Decisions:** Commercial onboarding of real ESP and BSP accounts remains pending.
- **Phase 6-05 (E2E Regression, Security Audit & Certification):** PENDING.
- **Production Status:** Strictly **`LOCKED`** (0/9 External Prerequisites Satisfied — 9 BLOCKED).
