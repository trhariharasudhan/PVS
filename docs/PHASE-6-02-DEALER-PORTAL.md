# PVS Silk S — Phase 6-02: Dealer Self-Service Portal & Credit Ledger UI

**Phase:** 6-02 — Dealer Self-Service Portal & Credit Ledger UI  
**Backend Endpoints:** [`backend/app/api/v1/endpoints/dealer.py`](file:///d:/PVS/backend/app/api/v1/endpoints/dealer.py)  
**Backend Service:** [`backend/app/services/dealer_portal_service.py`](file:///d:/PVS/backend/app/services/dealer_portal_service.py)  
**Frontend Portal Routes:** [`app/portal/dealer/*`](file:///d:/PVS/app/portal/dealer/)  
**Focused Test Suite:** [`backend/app/tests/test_dealer_portal_api.py`](file:///d:/PVS/backend/app/tests/test_dealer_portal_api.py) `(4/4 PASS)`  
**Full Test Suite:** `223 / 223 Tests Passing (100%) across 34 test modules`  
**Frontend Next.js Build:** `36 / 36 Production Routes Compiled (100% PASS)`  
**Status:** **PHASE 6-02 COMPLETE — FAIL-CLOSED PRODUCTION LOCK INTACT**  

---

> [!IMPORTANT]
> **GOVERNANCE & BOUNDARY DIRECTIVE:**  
> **Phase 6-02 implements only the B2B Dealer Self-Service Portal and Trade Credit Ledger.**  
> **Subsequent subphases (Phase 6-03 Payment Gateway Webhooks, Phase 6-04 Transactional Communications, Phase 6-05 Certification) are NOT implemented.**  
> Production cutover remains strictly **`LOCKED`** and **fail-closed**.

---

## 1. Objective & Scope

Phase 6-02 provides authenticated wholesale merchants and boutique owners (`DEALER` role) with a self-service workspace to:
1. **Browse Wholesale Saree Catalogue:** View authentic Kanchipuram pure silk sarees with server-calculated volume tiers and live stock availability.
2. **Interactive Tiered Quote Engine:** Real-time calculation of volume savings based on quantity thresholds.
3. **Wholesale Order Placement:** Place bulk orders with server-authoritative pricing, 5% handloom GST computation, trade credit policy verification, and atomic inventory reservation.
4. **Order History & Detail Tracking:** View past order status, line items, and linked tax invoices under strict tenant isolation (IDOR protected).
5. **Trade Credit & Statement of Account:** Real-time dashboard of approved trade credit limit, outstanding balances, unpaid invoices, and payment receipts.

---

## 2. Backend API Surface

| Method | Endpoint | Description | Auth & Security |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dealer/profile` | Dealer user and linked wholesale merchant profile | `require_dealer_user` |
| `GET` | `/api/v1/dealer/products` | Wholesale catalogue with active pricing tiers & stock | `require_dealer_user` |
| `GET` | `/api/v1/dealer/products/{id}` | Single product specifications, gallery & tier matrix | `require_dealer_user` |
| `POST` | `/api/v1/dealer/calculate-quote`| Deterministic tiered quote & savings breakdown | `require_dealer_user` |
| `POST` | `/api/v1/dealer/orders` | Place wholesale order against trade credit | `require_dealer_user` + stock & credit checks |
| `GET` | `/api/v1/dealer/orders` | Paginated order history for authenticated dealer | `require_dealer_user` (Tenant isolated) |
| `GET` | `/api/v1/dealer/orders/{id}` | Order breakdown and linked tax invoices | `require_dealer_user` (IDOR protected) |
| `GET` | `/api/v1/dealer/credit` | Credit limit, outstanding balance, available credit | `require_dealer_user` |
| `GET` | `/api/v1/dealer/ledger` | Financial statement: tax invoices & payment receipts | `require_dealer_user` |

---

## 3. Order Lifecycle & Security Invariants

### A. Server-Authoritative Pricing & GST
- All unit prices are computed server-side via `DealerPricingService.calculate_tiered_unit_price`. Any client-supplied price or discount values are strictly ignored.
- Pure silk handloom GST (5.0%) is computed server-side: $\text{tax\_amount} = \lfloor \text{subtotal} \times 0.05 \rceil_{0.01}$.

### B. Trade Credit Enforcement
- If approved `credit_limit > 0`, order creation checks:
  $$\text{outstanding\_balance} + \text{order\_total} \le \text{credit\_limit}$$
- If credit limit is exceeded, order creation fails safely with `400 Bad Request`.

### C. Atomic Inventory Locking
- When an order is placed, each product's `Inventory` row is locked using `SELECT ... FOR UPDATE`.
- Available stock ($\text{quantity\_on\_hand} - \text{quantity\_reserved}$) is validated.
- `quantity_reserved` is atomically incremented, preventing double-selling during concurrent dealer requests.

### D. IDOR & Tenant Isolation
- Dealer user accounts are linked to a single `Customer` record (`users.customer_id`).
- All queries for orders, invoices, credit, and ledger filter strictly on `customer_id == current_user.customer_id`.
- Accessing another dealer's order ID returns `404 Not Found`.

---

## 4. Frontend Next.js Routes (`/portal/dealer/*`)

1. **`/portal/dealer`**: Dealer dashboard with approved trade credit limit, available credit gauge, current outstanding amount, and recent orders.
2. **`/portal/dealer/products`**: Wholesale saree catalogue with search, weave filters, stock indicators, and volume pricing badges.
3. **`/portal/dealer/products/[productId]`**: High-resolution gallery, textile specifications, wholesale tier matrix, real-time quote calculator, and bulk order submission.
4. **`/portal/dealer/orders`**: Paginated order history with status pills, saree counts, and total amount.
5. **`/portal/dealer/orders/[orderId]`**: Order detail breakdown with line items, applied unit prices, statutory GST, and linked tax invoices.
6. **`/portal/dealer/ledger`**: Statement of account with credit KPIs, invoice ledger, and payment receipts.
7. **`/portal/dealer/profile`**: Merchant registration data, contact person, GSTIN, and shipping address.

---

## 5. Verification & Test Evidence

### A. Focused Phase 6-02 Backend Tests (`4 / 4 PASS`):
- `test_dealer_portal_full_e2e_workflow` $\rightarrow$ `PASSED`
- `test_dealer_order_idor_isolation` $\rightarrow$ `PASSED`
- `test_dealer_order_insufficient_stock_fails` $\rightarrow$ `PASSED`
- `test_dealer_unauthenticated_and_rbac_rejection` $\rightarrow$ `PASSED`

### B. Full Backend Pytest Suite:
$$\mathbf{223\ /\ 223\ pytest\ tests\ passing\ (100\%\ across\ 34\ test\ modules)}$$

### C. Frontend Next.js Production Build:
$$\mathbf{36\ /\ 36\ Next.js\ production\ routes\ compiling\ (100\%\ PASS)}$$

---

## 6. Database & Migration Status

- **Database Changes:** Zero new migrations required. All models (`User`, `Customer`, `Product`, `ProductPricingTier`, `Inventory`, `Order`, `Invoice`, `Payment`) fully support Phase 6-02 operations.
- **Migration Head:** `0004_phase_6_01_dealer_pricing_tiers` remains the verified linear head.

---

## 7. Explicit Non-Scope & Production Lock

- **Phase 6-03 (Payment Gateway Webhook Ingestion):** NOT IMPLEMENTED.
- **Phase 6-04 (Transactional Email & WhatsApp Dispatch):** NOT IMPLEMENTED.
- **Phase 6-05 (E2E Regression & Certification):** NOT IMPLEMENTED.
- **Production Status:** Strictly **`LOCKED`** (0/9 External Prerequisites Satisfied — 9 BLOCKED).
