# PVS SILK S — WHOLESALE CRM & TRADE OPERATIONS (PHASE 4C-B)

## 1. Overview
The Wholesale CRM module transforms public trade enquiries from saree boutiques, retail showroom chains, and exporters into managed sales negotiations and automated sales orders.

---

## 2. B2B Pipeline Stages

1. **`NEW`**: Inbound enquiry submitted via public `/wholesale` page or direct contact.
2. **`CONTACTED`**: Initial phone/WhatsApp outreach established by B2B sales staff.
3. **`CATALOGUE_SENT`**: High-resolution digital lookbook and wholesale pricing tier shared.
4. **`NEGOTIATING`**: Active discussion regarding bulk MOQs, custom colorways, and terms.
5. **`CONVERTED_TO_ORDER`**: Lead successfully converted into a confirmed customer order.
6. **`REJECTED`**: Lead closed due to mismatch in MOQ, unverified business credentials, or lack of capacity.

---

## 3. Wholesale Lead $\rightarrow$ Sales Order Conversion

When a sales executive clicks **"Convert to Wholesale Order"** (`POST /api/v1/admin/wholesale/{id}/convert`):

### Atomic Transaction Steps
1. **Customer Provisioning**:
   - Queries `Customer` table by phone number.
   - If not found, provisions a new `Customer` record with `customer_type = WHOLESALE_MERCHANT` and showroom details.
2. **Order Generation**:
   - Creates a new `Order` record with `order_type = WHOLESALE_BULK` and reference note `Converted from Wholesale Enquiry #{id}`.
3. **Price Snapshotting & Inventory Reservation**:
   - Captures agreed wholesale unit prices in `OrderItem`.
   - Acquires row-level lock on each product's `Inventory`.
   - Validates availability and increments `quantity_reserved`.
4. **CRM Stage Synchronization**:
   - Updates `WholesaleEnquiry.status` to `CONVERTED_TO_ORDER`.

### Idempotency Protection
If `convert` is invoked on an already converted enquiry, the repository locates the existing linked order and returns it directly without duplicating customer accounts, order records, or inventory reservations.
