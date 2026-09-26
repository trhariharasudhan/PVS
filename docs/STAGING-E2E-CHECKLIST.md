# PVS Silk S — Final Staging End-to-End Verification Checklist

| Operational Area | Test Case Description | Pass/Fail Criteria | Verified |
|---|---|---|:---:|
| **Public Storefront** | Home, Collections, Product Details, About, Contact, Manufacturing pages render without console errors. | HTTP 200, zero Next.js hydration errors | **PASS** |
| **Authentication** | Super Admin, Factory Manager, Sales Admin login via HttpOnly cookie & logout. | Cookies set with `HttpOnly; SameSite=Lax/Strict; Secure` | **PASS** |
| **RBAC Isolation** | Sales Admin cannot modify factory loom batches; Factory Manager cannot generate tax invoices. | Return HTTP 403 Forbidden | **PASS** |
| **Category & Products** | Create, view, edit category and products with artisan attributes and price formatting. | Server validation passes, product code unique | **PASS** |
| **Suppliers & RM** | Onboard silk reelers, pure zari suppliers; manage raw materials and reorder levels. | Duplicate supplier/material codes rejected | **PASS** |
| **Procurement & Receiving** | Issue purchase order, receive warp yarn atomically into stock ledger. | Quantity on hand increases, receipt logged | **PASS** |
| **Production & Looms** | Schedule loom batch, consume raw yarn, complete batch crediting finished sarees. | Raw stock decreases, finished stock credits | **PASS** |
| **Inventory Movements** | View immutable movement history for finished goods and raw materials. | Deltas match actual transactions | **PASS** |
| **Wholesale CRM** | Submit public wholesale inquiry, advance status, convert to wholesale order. | Lead converted, stock reserved | **PASS** |
| **Sales Orders** | Create retail/wholesale order, reserve stock, fulfill order with SALE movement. | Available stock decreases, on-hand decreases | **PASS** |
| **Invoicing & Taxes** | One-click tax invoice generation from sales order with 5% GST (CGST+SGST or IGST). | Server-authoritative totals and balance due | **PASS** |
| **Payments & Remittance**| Apply bank wire/UPI payment against invoice; update status to PARTIALLY_PAID / PAID. | Balance due correctly reduced to 0.00 | **PASS** |
| **PDF Invoices** | Download dynamic PDF tax invoice with configured business identity, GSTIN, and bank wire info. | Valid PDF stream, non-empty, proper layout | **PASS** |
| **Finance & Reports** | View MTD/YTD revenue KPIs, receivables aging, sales report, inventory valuation, CSV exports. | Correct JSON metrics and CSV downloads | **PASS** |
| **Health Probes** | `/health` (liveness) and `/ready` (readiness with DB connectivity) endpoints. | HTTP 200 when up; HTTP 503 if DB drops | **PASS** |
| **Security & Headers** | CSP, HSTS, X-Content-Type-Options, Referrer-Policy, CORS domain restriction. | All headers present on responses | **PASS** |
| **Backup & Recovery** | Logical pg_dump export, reset, and pg_restore recovery drill. | Data restored without loss | **PASS** |
