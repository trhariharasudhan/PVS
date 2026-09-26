# PVS Silk S — Financial Operations & Receivables Specification (Phase 4C-D)

## 1. Overview
The **Financial Operations Layer** provides complete accounting, outstanding balance management, aging analysis, and cash flow tracking for PVS Silk S handloom manufacturing and wholesale operations.

It connects:
* **Sales Orders & Clients:** Invoicing, customer credit, receivables aging, payments clearance.
* **Procurement & Suppliers:** Purchase bills, accounts payable aging, disbursements.
* **Banking & Remittances:** Bank transfers (NEFT/RTGS), UPI, cheques, trade credit adjustments.

---

## 2. Core Financial Models & Workflow

### 2.1 Double-Sided Invoicing & Billing
* **Tax Invoices (`TAX_INVOICE`):** Issued to retail and wholesale customers against confirmed orders or direct counter sales. Tracks taxable value, CGST+SGST or IGST, total receivable, paid amount, and outstanding balance.
* **Purchase Bills (`PURCHASE_BILL`):** Inward bills from silk reelers, zari spined mills, dye chemical suppliers, and loom spare vendors.
* **Proforma Invoices (`PROFORMA_INVOICE`):** Quotation and advance billing documents for custom loom production runs.

### 2.2 Payment Allocation & Settlement
When a payment is recorded against an invoice or bill:
1. Row-level pessimistic locking (`with_for_update()`) ensures transactional integrity against concurrent payments.
2. The `paid_amount` is incremented and `balance_due` is atomically recalculated.
3. If `balance_due == 0`, status becomes `PAID`.
4. If `balance_due > 0` and `paid_amount > 0`, status becomes `PARTIALLY_PAID`.
5. If linked to a Sales Order or Purchase Order, the order's clearance status is synchronized.

---

## 3. Aging Engine & Calculation Rules

Aging buckets are computed dynamically relative to the document date (`invoice_date`):
* **0–30 Days (Current):** `0 <= (Today - invoice_date) <= 30`
* **31–60 Days:** `31 <= (Today - invoice_date) <= 60`
* **61–90 Days:** `61 <= (Today - invoice_date) <= 90`
* **90+ Days (Critical Overdue):** `(Today - invoice_date) > 90`

### Aggregate Financial KPIs
* **Gross Revenue (MTD / YTD):** Aggregated revenue from confirmed sales orders and cleared invoices.
* **Total Accounts Receivable:** Sum of outstanding balances across all open customer tax invoices.
* **Total Accounts Payable:** Sum of outstanding balances across all open supplier purchase bills.
* **Net Cash Flow:** `Inbound Cleared Customer Remittances - Outbound Supplier Disbursements`.
* **Net Tax Liability:** `Output GST Collected on Invoices - Input Tax Credit on Raw Material Purchases`.

---

## 4. RBAC & Security Matrix

| Role | Invoices (View/Create/PDF) | Record Payment | Financial Overview | Aging Desks |
| :--- | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | Full Access | Full Access | Full Access | Full Access |
| **SALES_ADMIN** | Full Access | Full Access | View Only | View Receivables |
| **FACTORY_MANAGER** | View Only | Forbidden | View Payables | View Payables |
| **DEALER** | Forbidden | Forbidden | Forbidden | Forbidden |
