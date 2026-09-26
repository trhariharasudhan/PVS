# PVS Silk S — Phase 6 Scope Validation & Technical Implementation Blueprint

**Document:** Phase 6 Scope Validation & Implementation Plan  
**Planning Source:** [`docs/PHASE-6-DISCOVERY-ROADMAP.md`](file:///d:/PVS/docs/PHASE-6-DISCOVERY-ROADMAP.md)  
**Authoritative Baseline:** Phase 5L-01 through Phase 5L-06 `(208/208 Tests Passing — 31 Next.js Routes)`  
**Status:** **BLUEPRINT VALIDATED — AWAITING BUSINESS/PROVIDER DECISIONS (PLANNING ONLY)**  

---

> [!IMPORTANT]
> **GOVERNANCE & PLANNING NOTICE:**  
> This document is a **technical implementation blueprint and architecture validation**.  
> **No application code, database schema, or production infrastructure changes have been executed.**  
> Phase 5L remains **100% closed, tested, and certified in isolated staging**.  
> Live public production cutover remains strictly **`LOCKED`** and **fail-closed** until authentic external business and cloud infrastructure prerequisites are provided.

---

## 1. Executive Summary

This document validates the proposed **Phase 6: B2B Wholesale Dealer Portal, Payment Gateway Webhook Reconciliation & Communication Dispatch Pipeline** against the existing PVS Silk S codebase and architectural invariants.

### Key Validation Outcomes:
1. **High Architectural Compatibility:** The core models (`User`, `Customer`, `Order`, `Invoice`, `Payment`, `Audit`) and services are modular and directly support extension without requiring breaking refactors.
2. **Role `DEALER` Pre-Configured:** The `UserRole.DEALER` enum value is already integrated into the backend authentication and RBAC dependency guards.
3. **Database Change Isolation:** All proposed Phase 6 schema changes (Dealer profile linkage, tiered pricing rules, webhook idempotency logs, and communication delivery records) can be implemented via an additive, non-destructive Alembic migration (`0004_phase_6a_dealer_pricing_webhooks`).
4. **Safety & Zero Regression:** The plan preserves all existing **208 backend pytest tests**, **31 Next.js production routes**, and the **fail-closed 14-gate cutover authority lock**.

---

## 2. Architecture Compatibility Audit (Step 1)

| Subsystem / Module | Compatibility Classification | Architectural Analysis & Evidence |
|---|:---:|---|
| **User & RBAC Model** | `DIRECTLY COMPATIBLE` | `UserRole.DEALER` is already defined in [`backend/app/models/user.py`](file:///d:/PVS/backend/app/models/user.py). Adding a nullable `customer_id` foreign key maps dealer user accounts directly to wholesale merchant entities. |
| **Customer / Wholesale CRM** | `DIRECTLY COMPATIBLE` | [`Customer`](file:///d:/PVS/backend/app/models/customer.py) model contains `customer_type=WHOLESALE_MERCHANT`, `gstin`, `credit_limit`, and address fields required for credit ledger tracking. |
| **Product & Pricing Model** | `REQUIRES EXTENSION` | [`Product`](file:///d:/PVS/backend/app/models/product.py) currently stores a single `price` (MSRP). To support volume-based tiered wholesale discounts without breaking retail pricing, a separate `ProductPricingTier` model is required. |
| **Inventory & Movement** | `DIRECTLY COMPATIBLE` | [`Inventory`](file:///d:/PVS/backend/app/models/inventory.py) supports atomic reservation locking (`quantity_reserved`) and stock movement ledgers (`InventoryMovement`), preventing overselling during dealer checkout. |
| **Orders & Sales Lifecycle** | `DIRECTLY COMPATIBLE` | [`Order`](file:///d:/PVS/backend/app/models/order.py) and `OrderItem` support wholesale bulk order types (`OrderType.WHOLESALE_BULK`), custom line-item pricing, and stock confirmation state transitions. |
| **Tax Invoicing & 5% GST** | `DIRECTLY COMPATIBLE` | [`Invoice`](file:///d:/PVS/backend/app/models/invoice.py) and `InvoiceService` strictly enforce the statutory 5.0% handloom pure silk GST math and automated `INV-XXXX` sequencing. |
| **PDF Generation (ReportLab)**| `DIRECTLY COMPATIBLE` | Dynamic PDF invoice streaming is verified via `ReportLab` and can be attached directly to automated email/WhatsApp dispatch workers without refactoring. |
| **Payment Operations** | `REQUIRES EXTENSION` | [`Payment`](file:///d:/PVS/backend/app/models/payment.py) currently supports manual entry (`BANK_TRANSFER_NEFT_RTGS`, `UPI`, `CASH`). Ingesting webhook callbacks requires extending `PaymentMethod` with `ONLINE_GATEWAY` and adding a webhook idempotency log table. |
| **Audit Logging & Security** | `DIRECTLY COMPATIBLE` | [`log_audit_event`](file:///d:/PVS/backend/app/core/audit.py) captures actor, action, resource, IP, and `X-Correlation-ID` with automatic sensitive data masking (`[REDACTED]`). |
| **Frontend Routing & Layouts**| `DIRECTLY COMPATIBLE` | Next.js 14 App Router cleanly isolates the proposed `/portal/dealer/*` workspace with dedicated middleware layout guards, leaving existing public (`/`) and admin (`/admin/*`) routes untouched. |
| **Alembic Migration History** | `DIRECTLY COMPATIBLE` | Migration chain is single-head and linear through `0003_phase_4c_d_finance_invoicing`. All Phase 6 changes will append cleanly as `0004`. |

---

## 3. Database Impact Analysis (Step 2)

```
                                  +---------------------------------------+
                                  |         Existing Schema (0003)        |
                                  |    users, customers, products, orders |
                                  +-------------------+-------------------+
                                                      |
                                      [ Additive Linear Migration 0004 ]
                                                      |
                  +-----------------------------------+-----------------------------------+
                  |                                   |                                   |
+-----------------+------------------+ +--------------+---------------+ +-----------------+------------------+
|      users.customer_id (FK)        | |    product_pricing_tiers      | |       payment_webhook_logs        |
| Maps DEALER user to customer record| | SKU volume discount intervals | | Idempotent HMAC webhook events  |
+------------------------------------+ +-------------------------------+ +------------------------------------+
                                                      |
                                       +--------------+---------------+
                                       |     communication_logs       |
                                       | Email / WhatsApp PDF dispatch|
                                       +------------------------------+
```

### Proposed Database Change Matrix (Proposed Migration `0004`)

| Entity / Table | Proposed Change | Purpose & Relationship | Constraints & Indexes | Migration Risk |
|---|---|---|---|:---:|
| `users` | Add `customer_id` (UUID, Nullable) | Links `DEALER` user account to `customers.id` | `ForeignKey("customers.id", ondelete="SET NULL")`, `index=True` | Low (Additive) |
| `product_pricing_tiers` | **NEW TABLE** | Stores tiered volume pricing rules per SKU | `product_id (FK)`, `min_quantity >= 1`, `tier_price > 0`, `unique(product_id, min_quantity)` | Low (New Entity) |
| `payment_webhook_logs` | **NEW TABLE** | Stores raw gateway webhook payloads and idempotency keys | `event_id (unique, index)`, `gateway_name`, `status`, `payload (JSONB)` | Low (New Entity) |
| `communication_logs` | **NEW TABLE** | Records email/WhatsApp invoice delivery status and retries | `invoice_id (FK)`, `channel (EMAIL/WHATSAPP)`, `status`, `index(created_at)` | Low (New Entity) |

---

## 4. API Contract Plan (Step 3)

### 1. B2B Dealer Portal Endpoints (`/api/v1/dealer/*`)

#### `GET /api/v1/dealer/profile`
- **Auth:** Bearer JWT (HttpOnly Cookie) | **Role:** `DEALER`
- **Response (200):** Customer profile, registered GSTIN, credit limit, credit period days, and active balance.
- **Audit:** Read event logged.

#### `GET /api/v1/dealer/products`
- **Auth:** Bearer JWT | **Role:** `DEALER`
- **Query Params:** `category_id`, `search`, `page`, `page_size`
- **Response (200):** Saree catalogue with base price and tiered volume pricing matrix (`tiers: [{min_qty: 5, unit_price: 27000}]`).

#### `POST /api/v1/dealer/orders`
- **Auth:** Bearer JWT | **Role:** `DEALER`
- **Request Body:** `{"items": [{"product_id": "UUID", "quantity": 10}], "shipping_address": "...", "notes": "..."}`
- **Validation:** Minimum Order Quantity (MOQ) check, credit limit validation, and atomic stock reservation.
- **Response (201):** Created order object with line-item volume discounts and subtotal.
- **Error Cases:** `400 Bad Request` (MOQ not met, credit limit exceeded), `409 Conflict` (Insufficient stock).
- **Audit:** `DEALER_ORDER_PLACED` audit event logged.

#### `GET /api/v1/dealer/ledger`
- **Auth:** Bearer JWT | **Role:** `DEALER`
- **Response (200):** Real-time statement of account: total billed, total paid, outstanding balance, list of unpaid invoices with due dates.

---

### 2. Payment Gateway Webhook Endpoints (`/api/v1/webhooks/payments/*`)

#### `POST /api/v1/webhooks/payments/{gateway}`
- **Auth:** None (External Provider Webhook) | **Verification:** HMAC-SHA256 Header Signature
- **Headers:** `X-Razorpay-Signature` or `X-Cashfree-Signature`, `X-Webhook-Id`
- **Idempotency:** Checks `event_id` against `payment_webhook_logs`. If already processed, returns `200 OK` immediately.
- **Processing:** Validates payment payload $\rightarrow$ resolves `invoice_id` $\rightarrow$ records `Payment` $\rightarrow$ updates invoice balance.
- **Response (200):** `{"status": "PROCESSED", "payment_number": "PAY-XXXX"}`
- **Error Cases:** `400 Bad Request` (Invalid HMAC signature), `422 Unprocessable` (Malformed payload).
- **Audit:** `PAYMENT_WEBHOOK_RECEIVED` with sanitized payload and correlation ID.

---

### 3. Automated Communication Endpoints (`/api/v1/admin/communications/*`)

#### `POST /api/v1/admin/communications/invoices/{invoice_id}/send`
- **Auth:** Bearer JWT | **Role:** `SUPER_ADMIN`, `SALES_ADMIN`
- **Request Body:** `{"channels": ["EMAIL", "WHATSAPP"], "recipient_override": null}`
- **Processing:** Streams PDF invoice from memory $\rightarrow$ dispatches via configured provider adapter $\rightarrow$ logs delivery status.
- **Response (200):** `{"email_status": "QUEUED", "whatsapp_status": "QUEUED", "job_id": "JOB-XXXX"}`
- **Audit:** `COMMUNICATION_DISPATCH_TRIGGERED` logged.

---

## 5. Security Model & Threat Review (Step 4)

| # | Threat Surface | Attack Scenario | Required Mitigation | Verification Test | Severity |
|:---:|---|---|---|---|:---:|
| 1 | **Cross-Dealer Data Access (IDOR)** | Dealer A attempts to fetch Dealer B's orders or invoices via `/dealer/orders/{id}` | Enforce tenant isolation in service layer: filter all queries by `user.customer_id`. | `test_dealer_cannot_access_other_dealer_orders` | **Critical** |
| 2 | **Price Manipulation / MOQ Bypass** | Dealer alters line-item unit price in JSON payload or orders below minimum quantity | Service calculates pricing server-side using `ProductPricingTier`; ignores client-supplied unit prices. | `test_dealer_client_price_override_rejected` | **High** |
| 3 | **Inventory Race Conditions** | Concurrent orders for the last remaining bridal saree SKU | Utilize SQLAlchemy `with_for_update()` row-level locks during stock reservation transaction. | `test_concurrent_dealer_checkout_stock_safety` | **Critical** |
| 4 | **Webhook Replay & Duplicate Payments** | Attacker replays intercepted webhook payload to credit customer balance twice | Idempotency log table with unique `event_id` constraint. Duplicate events return cached 200 OK. | `test_payment_webhook_replay_idempotency` | **Critical** |
| 5 | **Webhook Signature Forgery** | Attacker sends fake payment success payload to `/webhooks/payments/razorpay` | Cryptographic HMAC-SHA256 signature verification with constant-time comparison (`hmac.compare_digest`). | `test_invalid_webhook_signature_rejected_400` | **Critical** |
| 6 | **WhatsApp / Email Secret Exposure** | API keys or webhook secrets leaked in application logs or JSON error responses | Sensitive field masking in `logging_config.py` and validator filters (`[REDACTED]`). | `test_communication_secrets_redacted_in_logs` | **High** |
| 7 | **Webhook Endpoint DoS / Flooding** | Attacker floods webhook endpoint with malformed payloads | Fast-path signature validation and IP rate-limiting at Nginx reverse proxy level. | `test_webhook_rate_limiting` | **Medium** |

---

## 6. Payment Architecture Decision (Step 5)

```
[ External Gateway Webhook ] ---> [ HMAC Signature Guard ] ---> [ Idempotency Check (DB) ]
                                                                             |
                                                                             v
[ Auto-Clear Invoice (PAID) ] <--- [ Record Inbound Payment ] <--- [ Match Invoice & Order ]
```

### Provider Architecture Evaluation:
- **HMAC Verification:** Standardized signature header validation (`X-Signature`).
- **Idempotency:** Enforced via `payment_webhook_logs` table.
- **Provider Agnostic Adapter Pattern:** Business logic interacts with `PaymentGatewayAdapter` interface (`verify_webhook()`, `parse_event()`, `create_order()`), preventing vendor lock-in.
- **Status:** **`PROVIDER DECISION REQUIRED`** (Selection between Razorpay, Cashfree, or SBI ePay belongs to executive sponsor based on commercial transaction fee structures).

---

## 7. Communication Architecture (Step 6)

### Provider-Agnostic Notification Pipeline:
- **Email Interface (`EmailProviderAdapter`):** Supports AWS SES / SendGrid / SMTP. Streams dynamic ReportLab PDF attachment without storing temporary files on disk.
- **WhatsApp Interface (`WhatsAppProviderAdapter`):** Supports WhatsApp Cloud API / Gupshup / Twilio. Utilizes pre-approved utility templates for invoice delivery.
- **Delivery Tracking & Retries:** Exponential backoff worker (3 retries) with status tracking in `communication_logs`.

---

## 8. Dealer Portal UX Plan (Step 7)

```
Proposed Dealer Workspace Routes (/portal/dealer/*):
├── /portal/dealer/login            (Dedicated B2B Authentication Screen)
├── /portal/dealer/dashboard        (Credit Limit Bar, Recent Orders, Quick Actions)
├── /portal/dealer/catalogue        (Saree Grid with Tiered Wholesale Price Badges)
├── /portal/dealer/catalogue/[id]   (High-Res Gallery, Loom Specs, Bulk MOQ Tier Table)
├── /portal/dealer/cart             (Bulk Matrix Selector, MOQ Validator, Credit Utilization)
├── /portal/dealer/orders           (Order History, Status Progress Stepper, Delivery Notes)
├── /portal/dealer/orders/[id]      (Order Detail, Line Items, Packing Breakdown)
├── /portal/dealer/invoices         (GST Tax Invoices, PDF Download, Balance Overview)
└── /portal/dealer/ledger           (Statement of Account, Payment Receipts, Aging Analysis)
```

- **Layout & Auth Guard:** Protected by Next.js middleware checking `role === 'DEALER'`.
- **Zero Impact on Admin / Storefront:** Operates under separate `/portal/dealer` path tree.

---

## 9. Phase 6 Implementation Order (Step 8)

```
[ Phase 6-01: B2B Dealer Authentication & Tiered Pricing Engine ]
                               |
                               v
[ Phase 6-02: Dealer Self-Service Portal & Credit Ledger UI ]
                               |
                               v
[ Phase 6-03: Payment Gateway Webhook Ingestion & Clearance ]
                               |
                               v
[ Phase 6-04: Transactional Email & WhatsApp Dispatch Pipeline ]
                               |
                               v
[ Phase 6-05: Phase 6 E2E Regression, Security Audit & Certification ]
```

### Breakdown of Proposed Units:
1. **Phase 6-01 (Pricing & Dealer Domain):** Add `product_pricing_tiers` model, link `users.customer_id`, implement tiered price calculation service.
2. **Phase 6-02 (Dealer Portal Frontend):** Implement Next.js `/portal/dealer/*` pages, bulk order cart, and credit ledger.
3. **Phase 6-03 (Payment Gateway Webhooks):** Implement HMAC webhook endpoints, idempotency handler, and automated invoice clearance.
4. **Phase 6-04 (Communication Pipeline):** Implement transactional email and WhatsApp notification service with PDF invoice streaming.
5. **Phase 6-05 (Integration & Certification):** Execute full regression suite (208+ tests), security penetration scan, and Phase 6 certification.

---

## 10. Test Strategy & Safety Requirements (Step 9)

- **Existing Test Preservation:** Mandatory invariant that all **208 existing backend pytest tests** remain passing.
- **Frontend Route Preservation:** All **31 existing Next.js routes** must continue to compile cleanly.
- **New Test Scope (~35 New Tests):**
  - Dealer RBAC & IDOR isolation tests (`test_dealer_rbac.py`)
  - Tiered pricing and MOQ calculation tests (`test_tiered_pricing.py`)
  - Webhook HMAC signature verification & replay tests (`test_payment_webhooks.py`)
  - Communication adapter mock delivery & retry tests (`test_communications.py`)
  - End-to-end dealer order $\rightarrow$ payment $\rightarrow$ invoice email flow (`test_dealer_e2e_lifecycle.py`)

---

## 11. Final Decision & Recommendation (Step 10)

$$\mathbf{FINAL\ CLASSIFICATION:\quad PHASE\ 6\ REQUIRES\ BUSINESS\ DECISION}$$

### Exact Business Decisions Required Before Implementation:
1. **Payment Gateway Selection:** Business approval on preferred payment provider (Razorpay vs Cashfree vs SBI ePay) and commercial merchant agreement.
2. **WhatsApp Business Account Provider:** Selection of WhatsApp Business solution partner (Meta Cloud API vs Gupshup) and template approval.
3. **Email Transactional Provider:** Selection of email transport provider (AWS SES vs SendGrid vs Corporate SMTP).
4. **Wholesale Credit Policy:** Formal commercial confirmation on default credit limits and credit periods for onboarded dealers.

$$\mathbf{PHASE\ 5L\ REMAINS\ FULLY\ CLOSED\ AND\ SAFELY\ LOCKED.}$$
$$\mathbf{PHASE\ 6\ IS\ FULLY\ BLUEPRINTED\ AND\ AWAITING\ COMMERCIAL\ DECISIONS.}$$
