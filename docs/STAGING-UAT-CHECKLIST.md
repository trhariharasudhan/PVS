# PVS Silk S — Staging User Acceptance Testing (UAT) Checklist

**Environment:** Staging  
**Tester Persona:** Business Owner, Showroom Sales Admin, Loom Factory Manager, Wholesale Merchant  

---

## 1. Storefront & Public Flow UAT

| # | Test Scenario | Expected Outcome | Status |
|:---:|---|---|:---:|
| 1.1 | Homepage & Heritage Banner | Hero section, artisan story, and featured sarees render cleanly | **PASS** |
| 1.2 | Saree Collections Catalogue | Filter by category, fabric (Pure Silk), color, weave type (Handloom) | **PASS** |
| 1.3 | Product Details View | High-res imagery, specifications (Zari, Warp/Weft, HSN), pricing | **PASS** |
| 1.4 | Wholesale Inquiries Submission | Form accepts business name, GSTIN, quantity requirements; returns reference ID | **PASS** |
| 1.5 | Contact Us & Showroom Locator | Showroom address, phone, email, and interactive inquiry form | **PASS** |
| 1.6 | Mobile Responsiveness & SEO | Fully responsive on mobile viewport; `robots.txt` & `sitemap.xml` active | **PASS** |

---

## 2. Manufacturing & Loom Management UAT (Factory Manager)

| # | Test Scenario | Expected Outcome | Status |
|:---:|---|---|:---:|
| 2.1 | Raw Material Cataloguing | View pure mulberry silk warp/weft yarns, gold/silver zari reels, unit costs | **PASS** |
| 2.2 | Purchase Order Issuance | Create PO for yarn reeler; track status `ORDERED` -> `RECEIVED` | **PASS** |
| 2.3 | Consignment Warehouse Receiving | Atomic receiving increments raw material stock on hand with movement ledger | **PASS** |
| 2.4 | Loom Batch Creation | Schedule loom batch for Kanchipuram Brocade Saree SKU | **PASS** |
| 2.5 | Raw Material Consumption | Deduct yarn consumed on loom; prevent negative stock overdraft | **PASS** |
| 2.6 | Production QC & Completion | Advance batch stages; completion credits finished saree inventory exactly once | **PASS** |

---

## 3. Sales, Orders & Wholesale CRM UAT (Sales Admin)

| # | Test Scenario | Expected Outcome | Status |
|:---:|---|---|:---:|
| 3.1 | Customer Management | Onboard B2C retail customers and B2B wholesale merchants with GSTIN | **PASS** |
| 3.2 | Sales Order Placement | Create order; reserve saree inventory atomically | **PASS** |
| 3.3 | Wholesale Lead Pipeline | Advance wholesale enquiry: `NEW` -> `CONTACTED` -> `CONVERTED_TO_ORDER` | **PASS** |
| 3.4 | Order Fulfillment | Mark order `FULFILLED`; deducts inventory and writes `SALE` movement | **PASS** |
| 3.5 | Order Cancellation | Cancel unfulfilled order; releases reserved inventory back to available stock | **PASS** |

---

## 4. Finance, Invoicing & Tax Acceptance UAT (Super Admin)

| # | Test Scenario | Expected Outcome | Status |
|:---:|---|---|:---:|
| 4.1 | Tax Invoice Generation | One-click invoice from sales order; server calculates 5% GST (CGST/SGST/IGST)| **PASS** |
| 4.2 | Bank Wire Remittance | Record NEFT/RTGS payment with UTR; balance due updates to zero | **PASS** |
| 4.3 | Dynamic PDF Invoice | Download official GST-compliant tax invoice PDF with business/bank branding | **PASS** |
| 4.4 | Receivables Aging Report | View 0-30, 31-60, 61-90, 90+ days aging brackets for wholesale clients | **PASS** |
| 4.5 | Business KPI Dashboard | MTD/YTD revenue, gross margins, inventory valuation, GSTR-1 tax summary | **PASS** |
| 4.6 | Financial CSV Exports | Export sales ledgers, customer aging, and tax reports as CSV | **PASS** |
