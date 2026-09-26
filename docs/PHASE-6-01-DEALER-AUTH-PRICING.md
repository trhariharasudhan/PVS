# PVS Silk S — Phase 6-01: B2B Dealer Authentication & Tiered Pricing Engine

**Phase:** 6-01 — B2B Dealer Authentication & Tiered Pricing Engine  
**Module(s):**  
- [`backend/app/models/user.py`](file:///d:/PVS/backend/app/models/user.py) (Dealer Customer FK linkage)  
- [`backend/app/models/product.py`](file:///d:/PVS/backend/app/models/product.py) (`ProductPricingTier` entity & relationship)  
- [`backend/app/services/dealer_pricing_service.py`](file:///d:/PVS/backend/app/services/dealer_pricing_service.py) (Deterministic server-side pricing engine)  
- [`backend/app/api/v1/endpoints/dealer.py`](file:///d:/PVS/backend/app/api/v1/endpoints/dealer.py) (Dealer workspace & admin pricing endpoints)  
- [`backend/alembic/versions/0004_phase_6_01_dealer_pricing_tiers.py`](file:///d:/PVS/backend/alembic/versions/0004_phase_6_01_dealer_pricing_tiers.py) (Alembic migration)  
**Test Suite:** [`backend/app/tests/test_dealer_auth_and_pricing.py`](file:///d:/PVS/backend/app/tests/test_dealer_auth_and_pricing.py) `(11/11 PASS)`  
**Full Test Suite:** `219 / 219 Tests Passing (100%) across 33 test modules`  
**Status:** **PHASE 6-01 COMPLETE — FAIL-CLOSED PRODUCTION LOCK INTACT**  

---

> [!IMPORTANT]
> **GOVERNANCE & PHASE BOUNDARY DIRECTIVE:**  
> **Phase 6-01 implements only the backend B2B dealer authentication, tenant isolation guard, and deterministic tiered wholesale pricing engine.**  
> **Subsequent subphases (Phase 6-02 Dealer Portal UI, Phase 6-03 Payment Webhooks, Phase 6-04 Transactional Communications, Phase 6-05 Certification) are NOT implemented.**  
> Production cutover remains strictly **`LOCKED`** and **fail-closed**.

---

## 1. Objective & Scope

Phase 6-01 establishes the server-side foundations for B2B wholesale commerce in the PVS Silk S platform:
1. **Dealer Identity & Tenant Isolation:** Maps `DEALER` user accounts directly to wholesale merchant entities in `customers` table via a foreign key (`users.customer_id`), preventing cross-dealer data access (IDOR).
2. **Deterministic Tiered Wholesale Pricing:** Introduces the `product_pricing_tiers` table and pricing engine to calculate volume-based discounts server-side without trusting client-submitted prices.
3. **Minimum Order Quantity (MOQ) Validation:** Enforces volume thresholds before pricing and order generation.
4. **Additive Linear Migration:** Maintains the single-head Alembic migration chain (`0001 -> 0002 -> 0003 -> 0004`).

---

## 2. Architecture & Database Changes

### A. Database Schema Updates (Migration `0004_phase_6_01_dealer_pricing_tiers`)

1. **`users` Table (Modified):**
   - Added column: `customer_id` (`UUID`, `ForeignKey("customers.id", ondelete="SET NULL")`, `nullable=True`, `index=True`).
   - Added relationship: `User.customer` (`lazy="selectin"`).
2. **`product_pricing_tiers` Table (New):**
   - `id`: `UUID` primary key.
   - `product_id`: `UUID` (`ForeignKey("products.id", ondelete="CASCADE")`, `index=True`).
   - `tier_name`: `String(100)` (e.g. "Standard Bulk (5+)", "Master Distributor (50+)").
   - `min_quantity`: `Integer` (`CheckConstraint("min_quantity >= 1")`).
   - `tier_price`: `Numeric(10, 2)` (`CheckConstraint("tier_price > 0")`).
   - `is_active`: `Boolean` (default `True`).
   - `created_at`, `updated_at`: `DateTime(timezone=True)`.
   - `UniqueConstraint("product_id", "min_quantity", name="uq_product_pricing_tier_min_qty")`.

```
+-----------------------------------------------------------------------------------------+
|                                    USERS TABLE                                          |
|  id (UUID PK) | email | role (DEALER/ADMIN) | customer_id (FK -> customers.id)          |
+----------------------------------------------------+------------------------------------+
                                                     |
                                                     v
                                          +---------------------+
                                          |   CUSTOMERS TABLE   |
                                          |  Wholesale Merchant |
                                          +---------------------+

+-----------------------------------------------------------------------------------------+
|                               PRODUCT_PRICING_TIERS                                     |
|  id (UUID PK) | product_id (FK) | tier_name | min_quantity | tier_price | is_active     |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Server-Side Deterministic Pricing Algorithm

The `DealerPricingService.calculate_tiered_unit_price` enforces strict server-side price determination:

$$\text{Active Tiers} = \{ t \in \text{Product.pricing\_tiers} \mid t.\text{is\_active} = \text{True} \land t.\text{min\_quantity} \le \text{Quantity} \}$$

$$\text{Unit Price} = \begin{cases} 
\max_{t \in \text{Active Tiers}} (t.\text{min\_quantity}).\text{tier\_price} & \text{if Active Tiers} \neq \emptyset \\
\text{Product.price} & \text{otherwise}
\end{cases}$$

- **Zero Client Trust:** Line-item pricing is computed on the server. Client-submitted prices are rejected.
- **Exact Decimal Arithmetic:** All price calculations use Python `Decimal` with 2 decimal places (`Decimal("0.01")`), avoiding floating-point rounding errors.
- **Inactive Tier Skipping:** Inactive tiers are ignored, automatically falling back to lower active tiers or base MSRP.

---

## 4. API Endpoints Implemented

### Dealer Workspace Endpoints (`/api/v1/dealer/*`)
- `GET /api/v1/dealer/profile`: Authenticated dealer retrieves their linked wholesale customer profile.
- `POST /api/v1/dealer/calculate-quote`: Server-side tiered price calculator returning unit price, total amount, and volume savings.

### Admin Tier Configuration Endpoints (`/api/v1/dealer/admin/*`)
- `POST /api/v1/dealer/admin/products/{product_id}/pricing-tiers`: Create a volume pricing tier (Requires `SUPER_ADMIN` or `SALES_ADMIN`).
- `GET /api/v1/dealer/admin/products/{product_id}/pricing-tiers`: List configured volume tiers for a product.
- `DELETE /api/v1/dealer/admin/pricing-tiers/{tier_id}`: Remove a volume pricing tier.

---

## 5. Security Model & IDOR Defenses

1. **Tenant Isolation Guard (`require_dealer_user`):**
   - Verifies the user possesses `role == UserRole.DEALER`.
   - Rejects unlinked dealer users with `403 Forbidden`.
   - Automatically scopes data access to the dealer's `customer_id`.
2. **Role Escalation Prevention:**
   - A `DEALER` user attempting to access admin endpoints (e.g. `/admin/finance/overview`, `/dealer/admin/pricing-tiers`) is blocked with `403 Forbidden`.
3. **Sensitive Credential Redaction:**
   - Credentials, passwords, and tokens remain fully masked in logging and exception handlers (`[REDACTED]`).

---

## 6. Verification & Test Evidence

### Focused Phase 6-01 Tests (`11 / 11 PASS`):
- `test_deterministic_tiered_pricing_selection`: PASSED
- `test_inactive_tier_skipped`: PASSED
- `test_invalid_quantity_handling`: PASSED
- `test_missing_pricing_configuration_raises_error`: PASSED
- `test_moq_validation_logic`: PASSED
- `test_calculate_line_item_quote_details`: PASSED
- `test_dealer_profile_tenant_isolation`: PASSED
- `test_unlinked_dealer_rejected_with_403`: PASSED
- `test_dealer_cannot_access_admin_endpoints`: PASSED
- `test_admin_pricing_tier_crud_lifecycle`: PASSED
- `test_alembic_single_head_chain_through_0004`: PASSED

### Full Backend Pytest Suite:
$$\mathbf{219\ /\ 219\ pytest\ tests\ passing\ (100\%\ across\ 33\ test\ modules)}$$

---

## 7. Explicit Non-Scope & Production Lock

- **Phase 6-02 (Dealer Portal UI):** NOT IMPLEMENTED.
- **Phase 6-03 (Payment Webhooks):** NOT IMPLEMENTED.
- **Phase 6-04 (Transactional Communications):** NOT IMPLEMENTED.
- **Phase 6-05 (Certification):** NOT IMPLEMENTED.
- **Production Status:** Strictly **`LOCKED`** (0/9 External Prerequisites Satisfied — 9 BLOCKED).
