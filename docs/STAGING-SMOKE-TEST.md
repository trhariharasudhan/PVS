# PVS Silk S — Staging Smoke Test Procedure & Verification Runbook

## 1. Objective
This smoke-test runbook outlines the step-by-step verification checklist to validate a fresh deployment in the **Staging** environment before promoting code to **Production**.

---

## 2. Core Business Verification Workflows

### 2.1 Workflow 1: Public Storefront to Wholesale Conversion
1. **Visit Storefront:**
   * Load `/` $\to$ Verify hero banner, brand tagline, featured categories, and footer business details.
   * Load `/collections` $\to$ Test category filters, search bar, and price range filters.
   * Open `/collections/[id]` $\to$ Verify high-resolution imagery, weave specifications, Silk Mark badge, and WhatsApp inquiry button.
2. **Submit Wholesale Enquiry:**
   * Navigate to `/wholesale`.
   * Fill out the B2B Wholesale Enquiry form with valid business details.
   * Submit $\to$ Verify success confirmation message.
3. **Admin CRM Verification:**
   * Log into Admin desk at `/admin/login`.
   * Open `/admin/wholesale` $\to$ Verify the submitted enquiry appears in the CRM pipeline.
   * Open `/admin/wholesale/[id]` $\to$ Convert enquiry to a confirmed Wholesale Customer and draft order.

---

### 2.2 Workflow 2: Sales Order to Tax Invoice & PDF Clearance
1. **Create Sales Order:**
   * Open `/admin/orders/new`.
   * Select the customer, choose 2 sarees, and confirm the order.
   * Verify that finished goods inventory is atomically reserved (`quantity_reserved`).
2. **Fulfill & Dispatch Order:**
   * In `/admin/orders/[id]`, change status to `SHIPPED`.
   * Verify stock is deducted (`quantity_on_hand` decreased, `quantity_reserved` released) and an immutable `SALE` movement is recorded in the inventory ledger.
3. **Generate GST Tax Invoice:**
   * Open `/admin/invoices`.
   * Click **Generate from Order** $\to$ Select the fulfilled order.
   * Verify HSN `5007` classification, CGST $2.5\% +$ SGST $2.5\%$ (or IGST $5.0\%$), subtotal, and grand total.
4. **Download & Verify PDF Tax Invoice:**
   * Click **Download Official PDF** $\to$ Verify luxury branding (Royal Burgundy & Gold), company GSTIN, buyer details, bank wire instructions, and signature block.
5. **Record Remittance:**
   * Click **Record Payment** $\to$ Enter bank UTR reference and amount.
   * Verify invoice status updates to `PAID` and customer balance due is cleared.

---

### 2.3 Workflow 3: Procurement, Raw Material Receipt & Loom Production
1. **Purchase Raw Materials:**
   * In `/admin/purchases/new`, create a Purchase Order for Mulberry Silk Yarn (HSN `5004`) from a registered supplier.
   * Mark Purchase Order as `RECEIVED`.
   * Verify raw material stock ledger increases with an immutable `PURCHASE_RECEIPT` record.
2. **Loom Production Batch:**
   * In `/admin/production/new`, initiate a new 10-saree production batch.
   * Consume raw silk yarn and zari spools.
   * Progress stages: `WARPING` $\to$ `WEAVING` $\to$ `CUTTING` $\to$ `ZARI_INSPECTION` $\to$ `COMPLETED`.
   * On batch completion, verify finished saree stock is credited into finished goods inventory.

---

### 2.4 Workflow 4: Financial KPIs & Statutory Reports
1. Open `/admin/finance` $\to$ Verify MTD/YTD Revenue, Accounts Receivable aging buckets, and Accounts Payable aging buckets.
2. Open `/admin/reports` $\to$ Test CSV exports for:
   * Sales & Revenue Ledger (`export=csv`).
   * Composite Inventory Valuation (`export=csv`).
   * GSTR-1 HSN Table 12 Report (`export=csv`).
