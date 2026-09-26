# PVS Silk S — Payment Management Foundation

## 1. Scope & Architecture

The Payment Management Foundation handles administrative accounting and financial reconciliation for PVS Silk S:
1. **Inbound Client Remittances:** Advance and balance payments received from retail clients and B2B wholesale boutiques.
2. **Outbound Supplier Disbursements:** Raw silk filature payments, pure zari mill settlements, and operational expenses.

> [!NOTE]
> In accordance with Phase 4C-C specifications, payments are recorded and tracked administratively with real bank UTR and cheque references without direct external payment gateway checkout integration.

---

## 2. Data Model Architecture

### 2.1 Payment Model (`payments`)
* `id` (UUID, PK)
* `payment_number` (VARCHAR(50), UNIQUE, e.g. `PVS-PAY-10042`)
* `payment_type` (`INBOUND_CUSTOMER_PAYMENT`, `OUTBOUND_SUPPLIER_PAYMENT`)
* `customer_id` (UUID, FK `customers.id`, optional for inbound)
* `supplier_id` (UUID, FK `suppliers.id`, optional for outbound)
* `order_id` (UUID, FK `orders.id`, optional sales order link)
* `purchase_order_id` (UUID, FK `purchase_orders.id`, optional purchase order link)
* `amount` (NUMERIC(12,2), transaction amount)
* `payment_method` (`BANK_TRANSFER_NEFT_RTGS`, `UPI`, `CHEQUE`, `CASH`, `TRADE_CREDIT`)
* `payment_status` (`RECORDED`, `CLEARED`, `BOUNCED_FAILED`, `VOID`)
* `reference_transaction_id` (VARCHAR(100), bank UTR, Cheque/DD number)
* `payment_date` (DATE)
* `notes` (TEXT, transaction remarks)
* `recorded_by_user_id` (UUID, FK `users.id`, staff operator)

---

## 3. RBAC Permissions Matrix

| Operation | Super Admin | Sales Admin | Factory Manager | Showroom / Dealer |
| :--- | :---: | :---: | :---: | :---: |
| **List Payments** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) |
| **View Payment Detail** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) |
| **Record Payment** | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Update Clearance Status** | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |
