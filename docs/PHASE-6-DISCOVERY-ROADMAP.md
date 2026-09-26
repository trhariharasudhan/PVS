# PVS Silk S — Post-Phase-5L Product Roadmap & Phase-6 Discovery Audit

**Audit Date:** 2026-08-31  
**Authoritative Closure Baseline:** Phase 5L-01 through Phase 5L-06 `(208/208 Tests Passing — Staging Verified 100%)`  
**Status:** **PROPOSED ROADMAP — NOT YET AUTHORITATIVE (DISCOVERY ONLY)**  

---

> [!IMPORTANT]
> **DISCOVERY AUDIT NOTICE:**  
> This document is a **read-only product discovery and planning audit**.  
> **No application code, database schema, or production infrastructure has been created or modified in this step.**  
> Phase 5L is **100% closed, tested, and certified in isolated staging**.  
> Live public production deployment remains strictly **`LOCKED`** and **fail-closed** until authentic external business and cloud infrastructure prerequisites are supplied.

---

## 1. Executive Summary

An exhaustive repository and architecture inspection was conducted across the backend services, Next.js frontend, PostgreSQL models, API routers, security subsystems, and verification harnesses of **PVS Silk S**.

1. **Phase 5L Closure Baseline:** All six Phase 5L subphases (5L-01 to 5L-06) are fully verified and closed.
   - **Backend:** 208 / 208 pytest tests passing across 32 modules (100% pass rate).
   - **Frontend:** 31 / 31 Next.js production routes compiled cleanly.
   - **Staging Preflight:** 15 / 15 operational domains verified.
   - **Release Lock:** Strictly `LOCKED` with production authorization `NOT_AUTHORIZED`.
2. **Current System State:** The core business workflows (storefront, wholesale CRM, raw material procurement, pit-loom batch manufacturing, sales order allocation, 5% GST invoicing, PDF generation, and payment recording) are **fully implemented and functioning end-to-end**.
3. **Post-5L Product Evolution:** The next logical product evolution for PVS Silk S post-launch focuses on **B2B Wholesale Dealer Self-Service**, **Payment Gateway Webhook Automation**, and **Automated Communications (WhatsApp/Email)**.

---

## 2. Phase 5L Closure Baseline

```
+-----------------------------------------------------------------------------------------+
|                  PVS SILK S — PHASE 5L CLOSURE BASELINE (v1.0.0-rc1)                    |
+-----------------------------------------------------------------------------------------+
| • 5L-01: Production Input Registry (12 canonical inputs tracked)             [CLOSED]   |
| • 5L-02: Business Identity & Tax Validator (15-digit GSTIN & 5% rate)         [CLOSED]   |
| • 5L-03: Saree Catalogue & Media Ingestion Validator (Textile specs & CDN)   [CLOSED]   |
| • 5L-04: Infrastructure Production Validator (PostgreSQL 16 & KMS secret)    [CLOSED]   |
| • 5L-05: Live Staging Preflight Smoke Suite (15 operational domains)         [CLOSED]   |
| • 5L-06: Production Cutover Authority & Release Lockdown (14 supreme gates)   [CLOSED]   |
+-----------------------------------------------------------------------------------------+
| Current Metric: 208/208 Tests Passing | 31 Frontend Routes | Release State: LOCKED      |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Current Architecture State

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (asyncio + asyncpg), Pydantic v2, ReportLab PDF streaming.
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Standalone Docker Runner.
- **Database:** PostgreSQL 16 with single-head linear Alembic chain (`0003_phase_4c_d_finance_invoicing`).
- **Security & RBAC:** HttpOnly JWT cookies, Argon2/Bcrypt salts, 4 RBAC roles (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`, `DEALER`), `X-Correlation-ID` propagation, and sensitive data redaction.
- **Operations:** Custom-format encrypted backup pipeline (`pg_dump` + AES-256 GPG, RPO 15m, RTO 60m), multi-stage non-root containers (`appuser:10001`, `nextjs:1001`), Nginx HSTS reverse proxy.

---

## 4. Capability Matrix (25 Operational Areas)

| Capability Area | Current Status | Description & Grounded Evidence |
|---|:---:|---|
| **1. Public Storefront** | `COMPLETE` | Public catalogue browsing, bridal/traditional/contemporary collections, responsive mobile-first layout. |
| **2. Saree Catalogue & Attributes** | `COMPLETE` | Pure mulberry silk, zari border, korvai weave, motif, color, weight, and pricing model. |
| **3. Saree Search & Filter** | `COMPLETE` | Category, weave type, color, price range, and availability filtering. |
| **4. Product Detail & Gallery** | `COMPLETE` | High-res image display, loom specifications, length/weight, and 5% GST tax display. |
| **5. Wholesale Enquiry Pipeline** | `COMPLETE` | Public enquiry form with GSTIN capture, admin status tracking, and notes. |
| **6. Customer / CRM** | `COMPLETE` | Customer registration, wholesale merchant categorization, credit limits, and credit periods. |
| **7. Dealer Management** | `COMPLETE` | Dealer user accounts, role assignment (`DEALER`), and merchant profile linkage. |
| **8. Inventory Management** | `COMPLETE` | Finished goods stock on hand, reserved stock, defective stock, reorder levels, and atomic movement ledger. |
| **9. Raw Material Procurement** | `COMPLETE` | Silk reeler and zari manufacturer registry, raw material lots, purchase orders, and warehouse receiving. |
| **10. Pit-Loom Manufacturing** | `COMPLETE` | Pit-loom asset registry, master weaver assignments, production batch creation, and progression tracking. |
| **11. Material Consumption** | `COMPLETE` | Silk yarn & zari consumption debited per batch; finished sarees credited upon completion. |
| **12. Quality Control (QC)** | `COMPLETE` | Grade A/B/C classification, defective unit segregation, and QC sign-off before inventory addition. |
| **13. Wholesale Order Lifecycle** | `COMPLETE` | Multi-item order placement, stock reservation, order confirmation, fulfillment, and delivery dispatch. |
| **14. Packing & Dispatch** | `COMPLETE` | Packing status transitions, dispatch notes, and delivery address tracking. |
| **15. Statutory 5% GST Math** | `COMPLETE` | Handloom pure silk statutory rate enforced: $\text{Total} = \text{Subtotal} + (\text{Subtotal} \times 0.05)$. |
| **16. Tax Invoicing Engine** | `COMPLETE` | Automated `INV-XXXX` sequencing, CGST/SGST/IGST breakdown, outstanding balances, and status tracking. |
| **17. Dynamic PDF Invoices** | `COMPLETE` | Server-side PDF generation using ReportLab streaming directly via `/admin/invoices/{id}/pdf`. |
| **18. Payments & Settlement** | `COMPLETE` | NEFT/RTGS/UPI and cash payment recording, invoice balance reconciliation, and receipt generation. |
| **19. Admin Operations Portal** | `COMPLETE` | Complete admin workspace across 15 operational routes with JWT cookie authentication. |
| **20. Business Reports & Analytics** | `COMPLETE` | Sales volume, revenue by category, loom batch completion metrics, and stock valuation summaries. |
| **21. Auditability & Logging** | `COMPLETE` | Structured JSON audit trail capturing actor, action, resource, IP, and correlation ID. |
| **22. Security & Token Revocation** | `COMPLETE` | HttpOnly secure cookies, token blacklisting for deactivated users, and 403 Forbidden role boundaries. |
| **23. Disaster Recovery** | `COMPLETE` | Automated GPG-encrypted backup and clean-schema restore drill verified (DR-01 to DR-04). |
| **24. External Business Inputs** | `EXTERNAL-DEPENDENCY`| Real GSTIN, physical address, SBI bank details, live inventory records, authentic photoshoot assets. |
| **25. Cloud Infrastructure** | `EXTERNAL-DEPENDENCY`| AWS RDS PostgreSQL 16, KMS secrets injection, apex DNS records, and wildcard TLS certificate. |

---

## 5. Repository Gap Analysis & Post-5L Findings

1. **No Application Functional Gaps for Launch:** The core platform contains zero blocking bugs or unimplemented core routes for Phase 5.
2. **Post-Launch Enhancement Opportunities:**
   - **Payment Gateway Webhooks:** Current payments are recorded via admin entry; live payment gateway webhook callbacks (e.g. Razorpay/Cashfree webhook verification) can be added post-launch.
   - **Dealer Self-Service Portal:** Currently, dealers browse public storefront and staff manage orders in admin; a dedicated dealer dashboard (`/portal/dealer/*`) would empower wholesale buyers to place orders directly.
   - **Automated Communication Dispatch:** Invoices are generated as PDFs; automated email/WhatsApp dispatch on order confirmation would enhance merchant engagement.

---

## 6. Technical Debt & Risk Register

| Risk / Item | Severity | Current Mitigation | Future Enhancement Plan |
|---|:---:|---|---|
| **ReportLab Font Dependencies** | Low | Fallback to standard Helvetica/Times fonts | Bundle custom Tamil Unicode fonts (e.g. Noto Sans Tamil) for bilingual receipts. |
| **High-Volume DB Connection Pools**| Low | AsyncPG pool sized for staging (10-20 connections) | Add PgBouncer or AWS RDS Proxy configuration for high-traffic wholesale rushes. |
| **Next.js Standalone Bundle Size** | Low | Multi-stage Docker build excludes `node_modules` | Optimize static asset caching with CloudFront/Cloudflare edge CDN. |

---

## 7. Proposed Phase 6 Candidates

```
Candidate A: B2B Wholesale Dealer Self-Service Portal & Tiered Pricing      [Priority: P1 - High]
Candidate B: Real-Time Payment Gateway Webhook Reconciliation Engine       [Priority: P1 - High]
Candidate C: Transactional Communications Engine (WhatsApp & Email)         [Priority: P2 - Medium]
Candidate D: Showroom POS Barcode & RFID Dispatch Scanner                   [Priority: P2 - Medium]
Candidate E: Advanced Loom Telemetry & Weaver Wage Settlement               [Priority: P3 - Optional]
```

### Ranking & Evaluation:
- **Rank 1 (P1 — High):** **Candidate A + B (Unified B2B Commerce & Payment Automation)** — Delivers maximum business value to Kanchipuram wholesale operations.
- **Rank 2 (P2 — Medium):** **Candidate C (Communications)** — Enhances customer satisfaction.
- **Rank 3 (P2 — Medium):** **Candidate D (Showroom POS)** — Benefits physical showroom checkout.
- **Rank 4 (P3 — Optional):** **Candidate E (Weaver Settlement)** — Specialized loom optimization.

---

## 8. Recommended Phase 6 Direction

$$\mathbf{RECOMMENDED\ PROPOSED\ PHASE\ 6:\quad B2B\ WHOLESALE\ PORTAL,\ PAYMENT\ GATEWAY\ \&\ COMMUNICATION\ ENGINE}$$
$$\mathbf{STATUS:\quad PROPOSED\ —\ NOT\ YET\ AUTHORITATIVE}$$

### Proposed Phase 6 Objective
Expand the already-hardened PVS Silk S platform to provide:
1. **Self-Service Wholesale Dealer Portal:** Dedicated dealer workspace for wholesale order placement, tiered pricing, and credit statement viewing.
2. **Automated Payment Gateway Webhooks:** Cryptographically verified webhook ingestion (Razorpay/Cashfree) for online wholesale booking deposits.
3. **Automated Transactional Notifications:** Background dispatch of order confirmation and GST tax invoice PDFs via Email (SES/SendGrid) and WhatsApp Business API.

---

## 9. Proposed Phase 6 Breakdown (Planning Units)

```
[ Phase 6-01: B2B Dealer Authentication & Tiered Pricing Engine ]
                               |
                               v
[ Phase 6-02: Dealer Self-Service Order & Credit Ledger Portal ]
                               |
                               v
[ Phase 6-03: Payment Gateway Webhook Ingestion & Clearance ]
                               |
                               v
[ Phase 6-04: Transactional Email & WhatsApp Dispatch Pipeline ]
                               |
                               v
[ Phase 6-05: Phase 6 Regression, E2E Smoke & Certification ]
```

### Proposed Planning Units:
- **Phase 6-01:** `DEALER` RBAC workspace routes, wholesale minimum order quantity (MOQ) rules, and tiered volume discount pricing engine.
- **Phase 6-02:** Frontend Dealer Portal (`/portal/dealer/*`) with live order tracking, credit limit utilization, and invoice download history.
- **Phase 6-03:** Webhook receiver endpoints (`/api/v1/webhooks/payments`) with HMAC signature verification, idempotent event processing, and automatic invoice clearance.
- **Phase 6-04:** Background notification worker with ReportLab PDF attachment streaming via transactional SMTP/API and WhatsApp templated messages.
- **Phase 6-05:** End-to-end integration test suite, security audit, regression verification, and certification.

---

## 10. Regression & Safety Contract

Any future Phase 6 implementation must strictly satisfy:
1. **Zero Regression:** All existing **208 backend pytest tests** must remain 100% passing.
2. **Frontend Invariant:** All existing **31 Next.js production routes** must continue to compile cleanly with 0 TypeScript errors.
3. **Production Lockdown Intact:** Live production cutover remains strictly `LOCKED` until genuine external cloud and business credentials are provided.
4. **GST Tax Invariant:** The 5.0% handloom pure silk statutory tax rate calculation cannot be bypassed or modified.
5. **Zero Fabrication:** No fake business credentials, banking data, or cloud resources will be generated.

---

## 11. Explicit Non-Goals

- **No Real Production Deployment:** Phase 6 does not perform live production DNS cutover or cloud database provisioning.
- **No Insecure Bypasses:** Phase 6 does not disable authentication, RBAC, or CSRF/CORS protections.
- **No Schema Corruption:** All future migrations must append linearly to `0003_phase_4c_d_finance_invoicing`.

---

## 12. Final Recommendation

$$\mathbf{PHASE\ 5L\ IS\ 100\%\ COMPLETE\ AND\ SAFELY\ LOCKED.}$$
$$\mathbf{PROPOSED\ PHASE\ 6\ ROADMAP\ IS\ DOCUMENTED\ FOR\ FUTURE\ STAKEHOLDER\ APPROVAL.}$$
$$\mathbf{NO\ CODE\ IMPLEMENTATION\ SHOULD\ PROCEED\ WITHOUT\ FORMAL\ ROADMAP\ AUTHORIZATION.}$$
