import uuid
import random
from decimal import Decimal
from typing import Optional, List, Tuple
from datetime import date, datetime, timezone
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invoice import Invoice, InvoiceItem, InvoiceType, InvoiceStatus
from app.models.order import Order, OrderItem, PaymentStatus
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.payment import Payment, PaymentType, PaymentMethod, PaymentRecordStatus
from app.schemas.admin.invoice import (
    AdminInvoiceCreate,
    AdminInvoiceItemCreate,
    AdminInvoiceStatusUpdate,
    AdminInvoiceRecordPaymentPayload,
)


class AdminInvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_invoices(
        self,
        page: int = 1,
        limit: int = 20,
        invoice_type: Optional[InvoiceType] = None,
        status: Optional[InvoiceStatus] = None,
        customer_id: Optional[uuid.UUID] = None,
        supplier_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Tuple[List[dict], int]:
        filters = []
        if invoice_type:
            filters.append(Invoice.invoice_type == invoice_type)
        if status:
            filters.append(Invoice.status == status)
        if customer_id:
            filters.append(Invoice.customer_id == customer_id)
        if supplier_id:
            filters.append(Invoice.supplier_id == supplier_id)
        if start_date:
            filters.append(Invoice.invoice_date >= start_date)
        if end_date:
            filters.append(Invoice.invoice_date <= end_date)

        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    Invoice.invoice_number.ilike(term),
                    Invoice.customer.has(Customer.full_name.ilike(term)),
                    Invoice.customer.has(Customer.company_name.ilike(term)),
                    Invoice.supplier.has(Supplier.supplier_name.ilike(term)),
                )
            )

        count_stmt = select(func.count(Invoice.id)).where(and_(*filters) if filters else True)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Invoice)
            .options(
                joinedload(Invoice.customer),
                joinedload(Invoice.supplier),
            )
            .where(and_(*filters) if filters else True)
            .order_by(desc(Invoice.invoice_date), desc(Invoice.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        invoices = result.scalars().all()

        items = []
        for inv in invoices:
            party_name = "Retail Client"
            if inv.customer:
                party_name = inv.customer.full_name + (f" ({inv.customer.company_name})" if inv.customer.company_name else "")
            elif inv.supplier:
                party_name = inv.supplier.supplier_name

            items.append({
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "invoice_type": inv.invoice_type,
                "party_name": party_name,
                "customer_id": inv.customer_id,
                "supplier_id": inv.supplier_id,
                "order_id": inv.order_id,
                "purchase_order_id": inv.purchase_order_id,
                "invoice_date": inv.invoice_date,
                "due_date": inv.due_date,
                "subtotal_amount": inv.subtotal_amount,
                "total_tax_amount": inv.total_tax_amount,
                "total_amount": inv.total_amount,
                "paid_amount": inv.paid_amount,
                "balance_due": inv.balance_due,
                "status": inv.status,
                "created_at": inv.created_at,
            })

        return items, total

    async def get_invoice_by_id(self, invoice_id: uuid.UUID) -> Optional[Invoice]:
        stmt = (
            select(Invoice)
            .options(
                joinedload(Invoice.customer),
                joinedload(Invoice.supplier),
                joinedload(Invoice.order),
                joinedload(Invoice.purchase_order),
                joinedload(Invoice.created_by_user),
                selectinload(Invoice.items),
                selectinload(Invoice.payments),
            )
            .where(Invoice.id == invoice_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def generate_invoice_number(self, invoice_type: InvoiceType) -> str:
        current_year = date.today().year
        prefix = "PVS-INV" if invoice_type == InvoiceType.TAX_INVOICE else "PVS-BILL"
        random_suffix = random.randint(1000, 9999)
        return f"{prefix}-{current_year}-{random_suffix}"

    async def create_invoice(
        self,
        payload: AdminInvoiceCreate,
        created_by_user_id: Optional[uuid.UUID] = None,
    ) -> Invoice:
        invoice_number = await self.generate_invoice_number(payload.invoice_type)

        # Tax calculations
        subtotal = Decimal("0.00")
        items_to_create = []

        for item_data in payload.items:
            qty = Decimal(str(item_data.quantity))
            rate = Decimal(str(item_data.unit_price))
            discount = Decimal(str(item_data.discount_amount))
            gst_pct = Decimal(str(item_data.gst_rate))

            line_taxable = max(Decimal("0.00"), (qty * rate) - discount)
            line_tax = (line_taxable * gst_pct) / Decimal("100.00")
            line_total = line_taxable + line_tax

            subtotal += line_taxable

            invoice_item = InvoiceItem(
                id=uuid.uuid4(),
                product_id=item_data.product_id,
                raw_material_id=item_data.raw_material_id,
                item_description=item_data.item_description,
                hsn_sac_code=item_data.hsn_sac_code,
                quantity=qty,
                unit_of_measure=item_data.unit_of_measure,
                unit_price=rate,
                discount_amount=discount,
                taxable_amount=line_taxable,
                gst_rate=gst_pct,
                tax_amount=line_tax,
                total_amount=line_total,
            )
            items_to_create.append(invoice_item)

        # Split taxes
        if payload.is_inter_state:
            igst_rate = Decimal("5.00")
            igst_amount = (subtotal * igst_rate) / Decimal("100.00")
            cgst_rate = Decimal("0.00")
            cgst_amount = Decimal("0.00")
            sgst_rate = Decimal("0.00")
            sgst_amount = Decimal("0.00")
        else:
            cgst_rate = Decimal("2.50")
            cgst_amount = (subtotal * cgst_rate) / Decimal("100.00")
            sgst_rate = Decimal("2.50")
            sgst_amount = (subtotal * sgst_rate) / Decimal("100.00")
            igst_rate = Decimal("0.00")
            igst_amount = Decimal("0.00")

        total_tax = cgst_amount + sgst_amount + igst_amount
        total_amount = subtotal + total_tax
        due_date = payload.due_date or payload.invoice_date

        invoice = Invoice(
            id=uuid.uuid4(),
            invoice_number=invoice_number,
            invoice_type=payload.invoice_type,
            order_id=payload.order_id,
            purchase_order_id=payload.purchase_order_id,
            customer_id=payload.customer_id,
            supplier_id=payload.supplier_id,
            invoice_date=payload.invoice_date,
            due_date=due_date,
            place_of_supply=payload.place_of_supply,
            customer_gstin=payload.customer_gstin,
            subtotal_amount=subtotal,
            cgst_rate=cgst_rate,
            cgst_amount=cgst_amount,
            sgst_rate=sgst_rate,
            sgst_amount=sgst_amount,
            igst_rate=igst_rate,
            igst_amount=igst_amount,
            total_tax_amount=total_tax,
            total_amount=total_amount,
            paid_amount=Decimal("0.00"),
            balance_due=total_amount,
            status=InvoiceStatus.ISSUED,
            terms_and_conditions=payload.terms_and_conditions,
            notes=payload.notes,
            created_by_user_id=created_by_user_id,
            items=items_to_create,
        )

        self.db.add(invoice)
        await self.db.commit()
        return await self.get_invoice_by_id(invoice.id)  # type: ignore

    async def create_invoice_from_order(
        self,
        order_id: uuid.UUID,
        created_by_user_id: Optional[uuid.UUID] = None,
    ) -> Invoice:
        stmt = (
            select(Order)
            .options(
                joinedload(Order.customer),
                selectinload(Order.items).joinedload(OrderItem.product),
            )
            .where(Order.id == order_id)
        )
        order = (await self.db.execute(stmt)).scalars().first()
        if not order:
            raise ValueError(f"Order with ID '{order_id}' not found.")

        # Prepare Invoice items
        items_payload = []
        for it in order.items:
            items_payload.append(
                AdminInvoiceItemCreate(
                    product_id=it.product_id,
                    item_description=it.product.name if it.product else f"Silk Saree Item ({it.quantity} pcs)",
                    hsn_sac_code="5007",
                    quantity=Decimal(str(it.quantity)),
                    unit_of_measure="PCS",
                    unit_price=it.unit_price,
                    discount_amount=Decimal("0.00"),
                    gst_rate=Decimal("5.00"),
                )
            )

        invoice_create = AdminInvoiceCreate(
            invoice_type=InvoiceType.TAX_INVOICE,
            order_id=order.id,
            customer_id=order.customer_id,
            invoice_date=date.today(),
            due_date=date.today(),
            place_of_supply="Tamil Nadu (33)",
            is_inter_state=False,
            customer_gstin=order.customer.gstin if order.customer else None,
            items=items_payload,
            notes=f"Auto-generated tax invoice for Order #{order.order_number}",
        )

        return await self.create_invoice(invoice_create, created_by_user_id)

    async def update_invoice_status(
        self,
        invoice_id: uuid.UUID,
        payload: AdminInvoiceStatusUpdate,
    ) -> Invoice:
        invoice = await self.get_invoice_by_id(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice with ID '{invoice_id}' not found.")

        invoice.status = payload.status
        if payload.notes:
            invoice.notes = (invoice.notes or "") + f"\n[Status Update]: {payload.notes}"

        await self.db.commit()
        return invoice

    async def record_payment_for_invoice(
        self,
        invoice_id: uuid.UUID,
        payload: AdminInvoiceRecordPaymentPayload,
        recorded_by_user_id: Optional[uuid.UUID] = None,
    ) -> Invoice:
        # Row lock
        stmt = (
            select(Invoice)
            .options(
                joinedload(Invoice.customer),
                joinedload(Invoice.order),
                selectinload(Invoice.payments),
                selectinload(Invoice.items),
            )
            .where(Invoice.id == invoice_id)
            .with_for_update()
        )
        invoice = (await self.db.execute(stmt)).scalars().first()
        if not invoice:
            raise ValueError(f"Invoice with ID '{invoice_id}' not found.")

        pay_amount = Decimal(str(payload.amount))
        if pay_amount <= Decimal("0.00"):
            raise ValueError("Payment amount must be greater than zero.")

        # Create Payment record
        payment_num = f"PVS-PAY-{date.today().year}-{random.randint(1000, 9999)}"
        payment_type = (
            PaymentType.INBOUND_CUSTOMER_PAYMENT
            if invoice.invoice_type == InvoiceType.TAX_INVOICE
            else PaymentType.OUTBOUND_SUPPLIER_PAYMENT
        )

        payment = Payment(
            id=uuid.uuid4(),
            payment_number=payment_num,
            payment_type=payment_type,
            customer_id=invoice.customer_id,
            supplier_id=invoice.supplier_id,
            order_id=invoice.order_id,
            purchase_order_id=invoice.purchase_order_id,
            invoice_id=invoice.id,
            amount=pay_amount,
            payment_method=payload.payment_method,
            payment_status=PaymentRecordStatus.CLEARED,
            reference_transaction_id=payload.reference_transaction_id,
            payment_date=payload.payment_date,
            notes=payload.notes or f"Payment applied to invoice #{invoice.invoice_number}",
            recorded_by_user_id=recorded_by_user_id,
            invoice=invoice,
        )
        self.db.add(payment)

        # Update invoice financials
        invoice.paid_amount += pay_amount
        invoice.balance_due = max(Decimal("0.00"), invoice.total_amount - invoice.paid_amount)

        if invoice.balance_due == Decimal("0.00"):
            invoice.status = InvoiceStatus.PAID
        elif invoice.paid_amount > Decimal("0.00"):
            invoice.status = InvoiceStatus.PARTIALLY_PAID

        # If order attached, update order payment status
        if invoice.order:
            if invoice.balance_due == Decimal("0.00"):
                invoice.order.payment_status = PaymentStatus.FULLY_PAID
            elif invoice.paid_amount > Decimal("0.00"):
                invoice.order.payment_status = PaymentStatus.ADVANCE_PAID

        inv_id = invoice.id
        await self.db.commit()
        return await self.get_invoice_by_id(inv_id)  # type: ignore
