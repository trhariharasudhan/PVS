# PVS SILK S — ORDERS & SALES OPERATIONS (PHASE 4C-B)

## 1. Overview
The Orders domain manages the complete lifecycle of customer orders (retail direct, wholesale bulk trade, and custom loom runs) while enforcing strict transactional safety with the physical inventory warehouse.

---

## 2. Order Lifecycle & Status State Machine

```
[ DRAFT / PENDING ] (Stock Reserved in Inventory)
       │
       ▼ (confirm)
[ CONFIRMED ] (Stock Reservation Preserved)
       │
       ▼ (process / ready)
[ PROCESSING / READY ]
       │
       ▼ (fulfill / dispatch)
[ SHIPPED / DELIVERED ] (Physical Stock Deducted + SALE Ledger Movement Logged)
       │
       └──> (Optional Return / Dispute)
```

### Cancellation Path
- An active order in `PENDING`, `CONFIRMED`, `PROCESSING`, or `READY` status can be cancelled via `POST /api/v1/admin/orders/{id}/cancel`.
- Cancellation immediately releases reserved inventory (`quantity_reserved -= quantity`).
- **Idempotency Guarantee**: If an order is already `CANCELLED`, repeating the cancel request will not reduce reserved inventory twice or cause negative values.

---

## 3. Inventory Reservation & Concurrency

### Row-Level Locking
During order creation (`POST /api/v1/admin/orders`) and wholesale lead conversion (`POST /api/v1/admin/wholesale/{id}/convert`), each saree product's inventory row is locked with:
```sql
SELECT * FROM inventory WHERE product_id = :product_id FOR UPDATE OF inventory;
```

### Availability Formula
$$\text{quantity\_available} = \max(0, \text{quantity\_on\_hand} - \text{quantity\_reserved})$$

- If $\text{quantity\_available} < \text{requested\_quantity}$, the transaction is aborted and raises `409 Conflict`.
- If sufficient stock exists, `quantity_reserved` is incremented by $\text{requested\_quantity}$.

---

## 4. Financial Calculations & Price Snapshots

- **Price Snapshotting**: Unit prices are permanently captured in `order_items.unit_price` at the moment of order placement. Future changes to the master catalogue price do not retroactively alter historic orders.
- **Server-Side Verification**: Subtotals and grand totals are calculated server-side:
$$\text{subtotal\_amount} = \sum (\text{item.quantity} \times \text{item.unit\_price})$$
$$\text{total\_amount} = \text{subtotal\_amount} + \text{tax\_amount} + \text{shipping\_amount}$$

---

## 5. Fulfillment & The Immutable SALE Ledger

When an order is fulfilled (`POST /api/v1/admin/orders/{id}/fulfill`):
1. Verifies order is not already fulfilled or cancelled.
2. Checks that a `SALE` movement with reference `ORDER-{order_number}` does not already exist (duplicate prevention).
3. Decrements physical on-hand stock:
   $$\text{quantity\_on\_hand} = \max(0, \text{quantity\_on\_hand} - \text{quantity})$$
4. Clears reservation:
   $$\text{quantity\_reserved} = \max(0, \text{quantity\_reserved} - \text{quantity})$$
5. Appends an immutable `InventoryMovement` record:
   - `movement_type`: `MovementType.SALE`
   - `quantity_delta`: `-quantity`
   - `reference_id`: `ORDER-{order_number}`
   - `notes`: `"Order fulfillment for {order_number}"`
