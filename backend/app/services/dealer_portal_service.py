import uuid
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from datetime import date
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.customer import Customer, CustomerType
from app.models.product import Product, ProductPricingTier
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.payment import Payment, PaymentType, PaymentRecordStatus
from app.services.dealer_pricing_service import DealerPricingService
from app.core.audit import log_audit_event


DEFAULT_WHOLESALE_CREDIT_LIMIT = Decimal("500000.00")  # INR 5 Lakh standard wholesale trade credit
DEFAULT_CREDIT_PERIOD_DAYS = 30  # 30 days credit period


class DealerPortalService:
    """
    Phase 6-02: B2B Dealer Self-Service Portal & Financial Ledger Service.
    Enforces strict tenant isolation, server-side pricing, inventory locking,
    and trade credit policy.
    """

    @staticmethod
    async def get_dealer_catalogue(
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Fetch wholesale-eligible active products with their pricing tiers and inventory status.
        """
        query = (
            select(Product)
            .where(Product.is_active == True)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
                selectinload(Product.pricing_tiers),
                selectinload(Product.inventory),
            )
        )

        if category_id:
            query = query.where(Product.category_id == category_id)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.code.ilike(search_pattern),
                    Product.fabric.ilike(search_pattern),
                    Product.color.ilike(search_pattern),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        # Paginate
        offset = (page - 1) * limit
        paginated_q = query.order_by(Product.code.asc()).offset(offset).limit(limit)
        res = await db.execute(paginated_q)
        products = list(res.scalars().all())

        product_list = []
        for p in products:
            primary_image = None
            if p.images:
                prim = next((img for img in p.images if img.is_primary), p.images[0])
                primary_image = prim.image_url

            stock_avail = 0
            if p.inventory:
                stock_avail = max(0, p.inventory.quantity_on_hand - p.inventory.quantity_reserved)

            tiers = [
                {
                    "id": str(t.id),
                    "tier_name": t.tier_name,
                    "min_quantity": t.min_quantity,
                    "tier_price": float(t.tier_price),
                    "is_active": t.is_active,
                }
                for t in (p.pricing_tiers or [])
                if t.is_active
            ]

            product_list.append({
                "id": str(p.id),
                "code": p.code,
                "name": p.name,
                "category_id": str(p.category_id) if p.category_id else None,
                "category_name": p.category.name if p.category else None,
                "fabric": p.fabric,
                "color": p.color,
                "border": p.border,
                "weave_type": p.weave_type,
                "base_retail_price": float(p.price) if p.price else None,
                "primary_image_url": primary_image,
                "available_stock": stock_avail,
                "pricing_tiers": tiers,
            })

        return product_list, total

    @staticmethod
    async def get_dealer_product_detail(
        db: AsyncSession,
        product_id: uuid.UUID,
    ) -> Optional[Dict[str, Any]]:
        """Fetch single product detail with all active pricing tiers and inventory."""
        query = (
            select(Product)
            .where(Product.id == product_id, Product.is_active == True)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
                selectinload(Product.pricing_tiers),
                selectinload(Product.inventory),
            )
        )
        res = await db.execute(query)
        p = res.scalars().first()
        if not p:
            return None

        images = [
            {
                "id": str(img.id),
                "image_url": img.image_url,
                "alt_text": img.alt_text,
                "is_primary": img.is_primary,
                "display_order": img.display_order,
            }
            for img in sorted(p.images or [], key=lambda i: i.display_order)
        ]

        tiers = [
            {
                "id": str(t.id),
                "tier_name": t.tier_name,
                "min_quantity": t.min_quantity,
                "tier_price": float(t.tier_price),
                "is_active": t.is_active,
            }
            for t in sorted(p.pricing_tiers or [], key=lambda t: t.min_quantity)
            if t.is_active
        ]

        stock_avail = 0
        if p.inventory:
            stock_avail = max(0, p.inventory.quantity_on_hand - p.inventory.quantity_reserved)

        return {
            "id": str(p.id),
            "code": p.code,
            "name": p.name,
            "category_id": str(p.category_id) if p.category_id else None,
            "category_name": p.category.name if p.category else None,
            "fabric": p.fabric,
            "color": p.color,
            "border": p.border,
            "pallu": p.pallu,
            "motif": p.motif,
            "weave_type": p.weave_type,
            "description": p.description,
            "detailed_story": p.detailed_story,
            "base_retail_price": float(p.price) if p.price else None,
            "saree_length_meters": float(p.saree_length_meters) if p.saree_length_meters else 5.5,
            "blouse_piece_description": p.blouse_piece_description,
            "weight_approx_grams": p.weight_approx_grams,
            "available_stock": stock_avail,
            "images": images,
            "pricing_tiers": tiers,
        }

    # --------------------------------------------------------------------------
    # Order Lifecycle & Atomic Reservation
    # --------------------------------------------------------------------------

    @classmethod
    async def create_dealer_order(
        cls,
        db: AsyncSession,
        dealer_user: User,
        items: List[Dict[str, Any]],
        notes: Optional[str] = None,
        shipping_address_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Atomically create a wholesale dealer order with strict server-side pricing,
        credit limit validation, and row-level inventory locking.
        """
        if not dealer_user.customer_id:
            raise ValueError("Dealer account is not linked to a wholesale merchant profile.")

        # 1. Fetch linked customer entity
        customer = await db.get(Customer, dealer_user.customer_id)
        if not customer:
            raise ValueError("Linked customer profile not found.")

        if not items:
            raise ValueError("Wholesale order must contain at least one line item.")

        # 2. Process items, calculate server-side tiered pricing, and validate stock
        subtotal = Decimal("0.00")
        processed_items = []
        product_locks: Dict[uuid.UUID, Tuple[Product, Inventory, Decimal, int]] = {}

        for item_req in items:
            prod_id = uuid.UUID(str(item_req["product_id"]))
            qty = int(item_req["quantity"])
            if qty < 1:
                raise ValueError(f"Quantity must be an integer >= 1 (received {qty}).")

            # Fetch product with pricing tiers
            p_q = (
                select(Product)
                .where(Product.id == prod_id, Product.is_active == True)
                .options(selectinload(Product.pricing_tiers))
            )
            p_res = await db.execute(p_q)
            prod = p_res.scalars().first()
            if not prod:
                raise ValueError(f"Product with ID '{prod_id}' not found or is inactive.")

            # Calculate server-side unit price (ignoring any client price payload)
            unit_price, applied_tier = DealerPricingService.calculate_tiered_unit_price(prod, qty)
            line_total = (unit_price * Decimal(qty)).quantize(Decimal("0.01"))
            subtotal += line_total

            # Lock inventory row with SELECT FOR UPDATE
            inv_q = (
                select(Inventory)
                .where(Inventory.product_id == prod_id)
                .with_for_update(of=Inventory)
            )
            inv_res = await db.execute(inv_q)
            inv = inv_res.scalars().first()

            if not inv:
                inv = Inventory(
                    id=uuid.uuid4(),
                    product_id=prod_id,
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    reorder_threshold=5,
                )
                db.add(inv)
                await db.flush()

            # Check stock availability
            avail_stock = inv.quantity_on_hand - inv.quantity_reserved
            if avail_stock < qty:
                raise ValueError(
                    f"Insufficient stock for '{prod.name}' ({prod.code}). Requested: {qty}, Available: {avail_stock}."
                )

            product_locks[prod_id] = (prod, inv, unit_price, qty)
            processed_items.append({
                "product": prod,
                "inventory": inv,
                "unit_price": unit_price,
                "quantity": qty,
                "line_total": line_total,
                "custom_notes": item_req.get("custom_notes"),
            })

        # 3. Calculate 5% Handloom Pure Silk GST
        tax_amount = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
        shipping_amount = Decimal("0.00")
        total_amount = subtotal + tax_amount + shipping_amount

        # 4. Enforce Dealer Credit Policy
        credit_info = await cls.get_dealer_credit_summary(db, customer.id)
        available_credit = Decimal(str(credit_info["available_credit"]))
        credit_limit = Decimal(str(credit_info["credit_limit"]))

        if credit_limit > Decimal("0.00") and total_amount > available_credit:
            raise ValueError(
                f"Order total (INR {total_amount:,.2f}) exceeds available trade credit (INR {available_credit:,.2f}). "
                f"Outstanding balance: INR {credit_info['outstanding_balance']:,.2f} / Limit: INR {credit_limit:,.2f}."
            )

        # 5. Generate unique order number
        today_str = date.today().strftime("%Y%m%d")
        count_today_q = select(func.count(Order.id)).where(Order.order_number.like(f"ORD-DEALER-{today_str}-%"))
        today_count = (await db.execute(count_today_q)).scalar() or 0
        order_num = f"ORD-DEALER-{today_str}-{(today_count + 1):04d}"

        # 6. Create Order and OrderItems
        order = Order(
            id=uuid.uuid4(),
            order_number=order_num,
            customer_id=customer.id,
            order_type=OrderType.WHOLESALE_BULK,
            order_status=OrderStatus.PENDING,
            payment_status=PaymentStatus.PENDING,
            subtotal_amount=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            total_amount=total_amount,
            notes=notes,
        )
        db.add(order)
        await db.flush()

        # 7. Reserve inventory and record items
        for item_info in processed_items:
            prod = item_info["product"]
            inv = item_info["inventory"]
            qty = item_info["quantity"]
            u_price = item_info["unit_price"]
            l_total = item_info["line_total"]

            order_item = OrderItem(
                id=uuid.uuid4(),
                order_id=order.id,
                product_id=prod.id,
                unit_price=u_price,
                quantity=qty,
                custom_colorway_notes=item_info["custom_notes"],
                line_total=l_total,
            )
            db.add(order_item)

            # Atomically increment reserved stock
            inv.quantity_reserved += qty

        await db.commit()

        await db.refresh(order)

        # Audit log
        log_audit_event(
            event_type="ORDER",
            action="DEALER_WHOLESALE_ORDER_CREATED",
            status="SUCCESS",
            user_id=str(dealer_user.id),
            user_role=dealer_user.role.value,
            resource_id=str(order.id),
            details={
                "order_number": order_num,
                "customer_id": str(customer.id),
                "total_amount": float(total_amount),
                "item_count": len(processed_items),
            },
        )


        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "order_type": order.order_type.value,
            "order_status": order.order_status.value,
            "payment_status": order.payment_status.value,
            "subtotal_amount": float(order.subtotal_amount),
            "tax_amount": float(order.tax_amount),
            "shipping_amount": float(order.shipping_amount),
            "total_amount": float(order.total_amount),
            "item_count": len(processed_items),
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    # --------------------------------------------------------------------------
    # Dealer Order History & IDOR-Protected Details
    # --------------------------------------------------------------------------

    @staticmethod
    async def get_dealer_orders(
        db: AsyncSession,
        customer_id: uuid.UUID,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch all orders strictly owned by the authenticated dealer's customer."""
        base_q = (
            select(Order)
            .where(Order.customer_id == customer_id)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
            )
        )

        count_stmt = select(func.count()).select_from(base_q.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * limit
        paginated_q = base_q.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        res = await db.execute(paginated_q)
        orders = list(res.scalars().all())

        order_list = []
        for o in orders:
            item_count = sum(i.quantity for i in o.items) if o.items else 0
            
            # Fetch invoice if exists
            inv_stmt = select(Invoice.invoice_number).where(Invoice.order_id == o.id).limit(1)
            invoice_num = (await db.execute(inv_stmt)).scalar()

            order_list.append({
                "id": str(o.id),
                "order_number": o.order_number,
                "order_type": o.order_type.value,
                "order_status": o.order_status.value,
                "payment_status": o.payment_status.value,
                "subtotal_amount": float(o.subtotal_amount),
                "tax_amount": float(o.tax_amount),
                "total_amount": float(o.total_amount),
                "item_count": item_count,
                "invoice_number": invoice_num,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            })

        return order_list, total

    @staticmethod
    async def get_dealer_order_detail(
        db: AsyncSession,
        customer_id: uuid.UUID,
        order_id: uuid.UUID,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch single order detail with strict tenant isolation.
        Returns None if order does not belong to customer_id (IDOR defense).
        """
        query = (
            select(Order)
            .where(Order.id == order_id, Order.customer_id == customer_id)
            .options(
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            )
        )
        res = await db.execute(query)
        o = res.scalars().first()
        if not o:
            return None

        items = []
        for i in (o.items or []):
            primary_url = None
            if i.product and i.product.images:
                prim = next((img for img in i.product.images if img.is_primary), i.product.images[0])
                primary_url = prim.image_url

            items.append({
                "id": str(i.id),
                "product_id": str(i.product_id),
                "product_code": i.product.code if i.product else "UNKNOWN",
                "product_name": i.product.name if i.product else "Unknown Saree",
                "category_name": i.product.category.name if (i.product and i.product.category) else None,
                "primary_image_url": primary_url,
                "unit_price": float(i.unit_price),
                "quantity": i.quantity,
                "line_total": float(i.line_total),
                "custom_notes": i.custom_colorway_notes,
            })

        # Fetch associated invoices
        inv_q = select(Invoice).where(Invoice.order_id == o.id)
        inv_res = await db.execute(inv_q)
        invoices = list(inv_res.scalars().all())

        invoice_refs = [
            {
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "total_amount": float(inv.total_amount),
                "balance_due": float(inv.balance_due),
                "status": inv.status.value,
                "issue_date": inv.issue_date.isoformat() if inv.issue_date else None,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
            }
            for inv in invoices
        ]


        return {
            "id": str(o.id),
            "order_number": o.order_number,
            "order_type": o.order_type.value,
            "order_status": o.order_status.value,
            "payment_status": o.payment_status.value,
            "subtotal_amount": float(o.subtotal_amount),
            "tax_amount": float(o.tax_amount),
            "shipping_amount": float(o.shipping_amount),
            "total_amount": float(o.total_amount),
            "notes": o.notes,
            "items": items,
            "invoices": invoice_refs,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }

    # --------------------------------------------------------------------------
    # Financial Credit & Ledger Statement
    # --------------------------------------------------------------------------

    @staticmethod
    async def get_dealer_credit_summary(
        db: AsyncSession,
        customer_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Compute real-time credit limit, outstanding balance, and available trade credit."""
        # 1. Total outstanding balance from active tax invoices
        stmt = (
            select(func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")))
            .where(
                and_(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                )
            )
        )
        outstanding = (await db.execute(stmt)).scalar() or Decimal("0.00")

        # 2. Count unpaid invoices
        unpaid_count_stmt = (
            select(func.count(Invoice.id))
            .where(
                and_(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                )
            )
        )
        unpaid_invoices_count = (await db.execute(unpaid_count_stmt)).scalar() or 0

        # Credit Limit calculation
        credit_limit = DEFAULT_WHOLESALE_CREDIT_LIMIT
        available_credit = max(Decimal("0.00"), credit_limit - outstanding)

        return {
            "customer_id": str(customer_id),
            "credit_limit": float(credit_limit),
            "outstanding_balance": float(outstanding),
            "available_credit": float(available_credit),
            "unpaid_invoices_count": unpaid_invoices_count,
            "credit_period_days": DEFAULT_CREDIT_PERIOD_DAYS,
        }

    @classmethod
    async def get_dealer_ledger_statement(
        cls,
        db: AsyncSession,
        customer_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Fetch comprehensive financial ledger: invoices, recorded payments, and running balance."""
        credit_summary = await cls.get_dealer_credit_summary(db, customer_id)

        # 1. Invoices
        inv_q = (
            select(Invoice)
            .where(Invoice.customer_id == customer_id)
            .order_by(Invoice.invoice_date.desc(), Invoice.created_at.desc())
        )
        inv_res = await db.execute(inv_q)
        invoices = list(inv_res.scalars().all())

        invoice_records = [
            {
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "invoice_type": inv.invoice_type.value,
                "total_amount": float(inv.total_amount),
                "amount_paid": float(inv.paid_amount),
                "balance_due": float(inv.balance_due),
                "status": inv.status.value,
                "issue_date": inv.invoice_date.isoformat() if inv.invoice_date else None,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
            }
            for inv in invoices
        ]


        # 2. Payments
        pay_q = (
            select(Payment)
            .where(
                Payment.customer_id == customer_id,
                Payment.payment_type == PaymentType.INBOUND_CUSTOMER_PAYMENT,
            )
            .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
        )
        pay_res = await db.execute(pay_q)
        payments = list(pay_res.scalars().all())

        payment_records = [
            {
                "id": str(pay.id),
                "payment_number": pay.payment_number,
                "amount": float(pay.amount),
                "payment_method": pay.payment_method.value,
                "payment_status": pay.payment_status.value,
                "reference_number": pay.reference_transaction_id,
                "reference_transaction_id": pay.reference_transaction_id,
                "payment_date": pay.payment_date.isoformat() if pay.payment_date else None,


            }
            for pay in payments
        ]

        return {
            "customer_id": str(customer_id),
            "credit_summary": credit_summary,
            "invoices": invoice_records,
            "payments": payment_records,
        }
