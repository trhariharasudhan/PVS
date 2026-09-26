import uuid
import random
from decimal import Decimal
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import Inventory, InventoryMovement, MovementType


class AdminOrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_unique_order_number(self) -> str:
        """Generate human-readable unique order number e.g. PVS-ORD-10042."""
        for _ in range(20):
            num = random.randint(10000, 99999)
            code = f"PVS-ORD-{num}"
            existing = await self.get_by_number(code)
            if not existing:
                return code
        # Fallback with timestamp suffix
        return f"PVS-ORD-{int(datetime.now().timestamp()) % 1000000}"

    async def get_by_number(self, order_number: str) -> Optional[Order]:
        query = select(Order).where(Order.order_number == order_number.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        status: Optional[str] = None,
        order_type: Optional[str] = None,
        payment_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Order], int]:
        """Query orders with customer and item relations."""
        base_query = (
            select(Order)
            .join(Order.customer)
            .options(
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            )
        )

        if status:
            try:
                s_enum = OrderStatus(status.upper().strip())
                base_query = base_query.where(Order.order_status == s_enum)
            except ValueError:
                pass

        if order_type:
            try:
                t_enum = OrderType(order_type.upper().strip())
                base_query = base_query.where(Order.order_type == t_enum)
            except ValueError:
                pass

        if payment_status:
            try:
                p_enum = PaymentStatus(payment_status.upper().strip())
                base_query = base_query.where(Order.payment_status == p_enum)
            except ValueError:
                pass

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Order.order_number.ilike(term),
                    Customer.full_name.ilike(term),
                    Customer.company_name.ilike(term),
                    Customer.phone.ilike(term),
                    Customer.city.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        orders = list(result.scalars().all())
        return orders, total

    async def get_by_id(self, order_id: uuid.UUID) -> Optional[Order]:
        """Fetch single order by UUID with full relations."""
        query = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create_order_with_reservation(
        self,
        customer_id: uuid.UUID,
        order_type: OrderType,
        payment_status: PaymentStatus,
        items_payload: List[dict],
        tax_amount: Decimal = Decimal("0.00"),
        shipping_amount: Decimal = Decimal("0.00"),
        notes: Optional[str] = None,
    ) -> Order:
        """
        Atomically create an order, calculate financial totals server-side,
        snapshot unit prices, and reserve inventory with row-level locking.
        """
        order_number = await self.generate_unique_order_number()
        order_id = uuid.uuid4()

        subtotal = Decimal("0.00")
        order_items: List[OrderItem] = []

        # 1. Process items and lock inventory rows
        for item_data in items_payload:
            prod_id = item_data["product_id"]
            qty = item_data["quantity"]
            custom_notes = item_data.get("custom_colorway_notes")

            # Fetch product
            prod_q = select(Product).where(Product.id == prod_id)
            prod_res = await self.session.execute(prod_q)
            prod = prod_res.scalars().first()
            if not prod:
                raise ValueError(f"Product '{prod_id}' not found.")
            if not prod.is_active:
                raise ValueError(f"Product '{prod.code}' is deactivated/archived.")

            # Price snapshot
            unit_price = Decimal(str(item_data["unit_price"])) if item_data.get("unit_price") is not None else (prod.price or Decimal("0.00"))
            line_total = unit_price * qty
            subtotal += line_total

            # Lock inventory row
            inv_q = (
                select(Inventory)
                .where(Inventory.product_id == prod_id)
                .with_for_update(of=Inventory)
            )
            inv_res = await self.session.execute(inv_q)
            inv = inv_res.scalars().first()

            if not inv:
                # Initialize inventory if missing
                inv = Inventory(
                    id=uuid.uuid4(),
                    product_id=prod_id,
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    reorder_threshold=5,
                )
                self.session.add(inv)
                await self.session.flush()

            # Check stock availability
            avail = inv.quantity_on_hand - inv.quantity_reserved
            if avail < qty:
                raise ValueError(
                    f"Insufficient available stock for '{prod.code}'. "
                    f"On-Hand: {inv.quantity_on_hand}, Already Reserved: {inv.quantity_reserved}, "
                    f"Available: {avail}, Requested: {qty}."
                )

            # Reserve stock
            inv.quantity_reserved += qty
            inv.updated_at = datetime.now(timezone.utc)

            # Create OrderItem
            order_item = OrderItem(
                id=uuid.uuid4(),
                order_id=order_id,
                product_id=prod_id,
                unit_price=unit_price,
                quantity=qty,
                custom_colorway_notes=custom_notes,
                line_total=line_total,
            )
            order_items.append(order_item)

        total_amount = subtotal + tax_amount + shipping_amount

        # 2. Create Order
        order = Order(
            id=order_id,
            order_number=order_number,
            customer_id=customer_id,
            order_type=order_type,
            order_status=OrderStatus.PENDING,
            payment_status=payment_status,
            subtotal_amount=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            total_amount=total_amount,
            notes=notes.strip() if notes else None,
        )
        self.session.add(order)
        for oi in order_items:
            self.session.add(oi)

        await self.session.commit()
        return await self.get_by_id(order_id)

    async def confirm_order(self, order: Order) -> Order:
        """Advance status from PENDING to CONFIRMED."""
        if order.order_status not in [OrderStatus.PENDING]:
            raise ValueError(f"Cannot confirm order in '{order.order_status}' status.")
        order.order_status = OrderStatus.CONFIRMED
        await self.session.commit()
        return await self.get_by_id(order.id)

    async def cancel_order_release_reservation(self, order: Order) -> Order:
        """
        Cancel order and release reserved inventory idempotently.
        """
        if order.order_status == OrderStatus.CANCELLED:
            return order  # Idempotent

        if order.order_status in [OrderStatus.DELIVERED, OrderStatus.SHIPPED]:
            raise ValueError(f"Cannot cancel order in '{order.order_status}' status after fulfillment.")

        # Release reservations for active order items
        for item in order.items:
            inv_q = (
                select(Inventory)
                .where(Inventory.product_id == item.product_id)
                .with_for_update(of=Inventory)
            )
            inv_res = await self.session.execute(inv_q)
            inv = inv_res.scalars().first()
            if inv:
                inv.quantity_reserved = max(0, inv.quantity_reserved - item.quantity)
                inv.updated_at = datetime.now(timezone.utc)

        order.order_status = OrderStatus.CANCELLED
        await self.session.commit()
        return await self.get_by_id(order.id)

    async def fulfill_order_sale(
        self, order: Order, user_id: Optional[uuid.UUID] = None
    ) -> Order:
        """
        Fulfill order: deduct physical stock, release reservation,
        and log atomic SALE movements. Idempotent.
        """
        if order.order_status in [OrderStatus.DELIVERED, OrderStatus.SHIPPED]:
            return order  # Already fulfilled

        if order.order_status == OrderStatus.CANCELLED:
            raise ValueError("Cannot fulfill a CANCELLED order.")

        # Check if already fulfilled via movement ledger reference
        ref_id = f"ORDER-{order.order_number}"
        check_mov_q = select(InventoryMovement.id).where(
            InventoryMovement.reference_id == ref_id,
            InventoryMovement.movement_type == MovementType.SALE,
        )
        existing_mov = (await self.session.execute(check_mov_q)).scalars().first()

        if not existing_mov:
            for item in order.items:
                inv_q = (
                    select(Inventory)
                    .where(Inventory.product_id == item.product_id)
                    .with_for_update(of=Inventory)
                )
                inv_res = await self.session.execute(inv_q)
                inv = inv_res.scalars().first()

                if inv:
                    inv.quantity_on_hand = max(0, inv.quantity_on_hand - item.quantity)
                    inv.quantity_reserved = max(0, inv.quantity_reserved - item.quantity)
                    inv.updated_at = datetime.now(timezone.utc)

                    movement = InventoryMovement(
                        id=uuid.uuid4(),
                        inventory_id=inv.id,
                        movement_type=MovementType.SALE,
                        quantity_delta=-item.quantity,
                        reference_id=ref_id,
                        performed_by_user_id=user_id,
                        notes=f"Order fulfillment for {order.order_number}",
                        created_at=datetime.now(timezone.utc),
                    )
                    self.session.add(movement)

        order.order_status = OrderStatus.DELIVERED
        await self.session.commit()
        return await self.get_by_id(order.id)
