# PVS Silk S — Business Reports & Export Specification (Phase 4C-D)

## 1. Overview
The **Business Reports & Analytics Subsystem** generates executive and statutory summaries with real-time computation, filtering parameters, and RFC 4180 compliant CSV stream exports.

---

## 2. Report Modules

### 2.1 Sales & Revenue Performance Report
* **Endpoint:** `GET /api/v1/admin/reports/sales`
* **CSV Export:** `GET /api/v1/admin/reports/sales?export=csv`
* **Filters:** `start_date`, `end_date`, `customer_type`, `order_type`.
* **Metrics:**
  * Total Confirmed Orders Count
  * Gross Sales Turnover (₹)
  * Net Taxable Sales (₹)
  * Total GST Collected (₹)
  * Wholesale Channel Volume (₹)
  * Retail Direct Channel Volume (₹)
* **Transaction Ledger Columns:** Date, Order #, Invoice #, Customer Name, Channel, Total Items, Taxable Value, GST, Grand Total, Payment Status.

### 2.2 Composite Inventory Valuation Report
* **Endpoint:** `GET /api/v1/admin/reports/inventory-valuation`
* **CSV Export:** `GET /api/v1/admin/reports/inventory-valuation?export=csv`
* **Valuation Model:**
  * **Raw Materials:** Weighted unit cost $\times$ Physical quantity on hand across yarn, zari spools, dyes, and loom supplies.
  * **Finished Handloom Sarees:** Wholesale cost value ($70\%$ of retail / wholesale contract rate) $\times$ Finished goods in stock.
  * **Combined Capital Valuation:** Total raw material value $+$ Total finished goods inventory.

### 2.3 Statutory GST (GSTR-1 Table 12) Summary Report
* **Endpoint:** `GET /api/v1/admin/reports/gst`
* **CSV Export:** `GET /api/v1/admin/reports/gst?export=csv`
* **Output Structure:**
  * Total Taxable Turnover
  * CGST / SGST (Intra-state supplies)
  * IGST (Inter-state outward supplies)
  * Total Tax Liability
  * **HSN Summary Table:** Grouped by HSN Code (`5007`, `5004`), description, unit quantity code (UQC: PCS, KGS), total quantity, taxable turnover, CGST, SGST, IGST, and total tax.

---

## 3. CSV Streaming Protocol
* **MIME Type:** `text/csv; charset=utf-8`
* **Header:** `Content-Disposition: attachment; filename=<report_name>-<date>.csv`
* **Encoding:** RFC 4180 with standard comma delimiters and quoted string fields.
