import uuid
from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_invoice_repository import AdminInvoiceRepository
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.schemas.admin.invoice import (
    AdminInvoiceList,
    AdminInvoiceDetail,
    AdminInvoiceItemDetail,
    AdminInvoicePaymentSummary,
    AdminInvoiceCreate,
    AdminInvoiceStatusUpdate,
    AdminInvoiceRecordPaymentPayload,
)
from app.utils.pdf_generator import generate_invoice_pdf


class AdminInvoiceService:
    def __init__(self, db: AsyncSession):
        self.repo = AdminInvoiceRepository(db)

    def _map_invoice_detail(self, inv: Invoice) -> AdminInvoiceDetail:
        party_name = "Retail Client"
        customer_name = None
        customer_phone = None
        customer_address = None
        customer_gstin = inv.customer_gstin

        if inv.customer:
            customer_name = inv.customer.full_name
            customer_phone = inv.customer.phone
            customer_address = f"{inv.customer.shipping_address or ''}, {inv.customer.city or ''}, {inv.customer.state or 'Tamil Nadu'}"
            party_name = inv.customer.full_name + (f" ({inv.customer.company_name})" if inv.customer.company_name else "")
            if not customer_gstin:
                customer_gstin = inv.customer.gstin
        elif inv.supplier:
            party_name = inv.supplier.supplier_name

        items = [
            AdminInvoiceItemDetail(
                id=it.id,
                product_id=it.product_id,
                raw_material_id=it.raw_material_id,
                item_description=it.item_description,
                hsn_sac_code=it.hsn_sac_code,
                quantity=it.quantity,
                unit_of_measure=it.unit_of_measure,
                unit_price=it.unit_price,
                discount_amount=it.discount_amount,
                taxable_amount=it.taxable_amount,
                gst_rate=it.gst_rate,
                tax_amount=it.tax_amount,
                total_amount=it.total_amount,
            )
            for it in (inv.items or [])
        ]

        payments = [
            AdminInvoicePaymentSummary(
                id=p.id,
                payment_number=p.payment_number,
                amount=p.amount,
                payment_method=p.payment_method,
                reference_transaction_id=p.reference_transaction_id,
                payment_date=p.payment_date,
                created_at=p.created_at,
            )
            for p in (inv.payments or [])
        ]

        return AdminInvoiceDetail(
            id=inv.id,
            invoice_number=inv.invoice_number,
            invoice_type=inv.invoice_type,
            party_name=party_name,
            customer_id=inv.customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_gstin=customer_gstin,
            customer_address=customer_address,
            supplier_id=inv.supplier_id,
            supplier_name=inv.supplier.supplier_name if inv.supplier else None,
            supplier_gstin=inv.supplier.gstin if inv.supplier else None,
            order_id=inv.order_id,
            order_number=inv.order.order_number if inv.order else None,
            purchase_order_id=inv.purchase_order_id,
            po_number=inv.purchase_order.po_number if inv.purchase_order else None,
            invoice_date=inv.invoice_date,
            due_date=inv.due_date,
            place_of_supply=inv.place_of_supply,
            subtotal_amount=inv.subtotal_amount,
            cgst_rate=inv.cgst_rate,
            cgst_amount=inv.cgst_amount,
            sgst_rate=inv.sgst_rate,
            sgst_amount=inv.sgst_amount,
            igst_rate=inv.igst_rate,
            igst_amount=inv.igst_amount,
            total_tax_amount=inv.total_tax_amount,
            total_amount=inv.total_amount,
            paid_amount=inv.paid_amount,
            balance_due=inv.balance_due,
            status=inv.status,
            terms_and_conditions=inv.terms_and_conditions,
            notes=inv.notes,
            created_by_name=inv.created_by_user.full_name if inv.created_by_user else None,
            items=items,
            payments=payments,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
        )

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
    ) -> Tuple[List[AdminInvoiceList], int]:
        items, total = await self.repo.get_invoices(
            page=page,
            limit=limit,
            invoice_type=invoice_type,
            status=status,
            customer_id=customer_id,
            supplier_id=supplier_id,
            search=search,
            start_date=start_date,
            end_date=end_date,
        )
        return [AdminInvoiceList(**it) for it in items], total

    async def get_invoice(self, invoice_id: uuid.UUID) -> Optional[AdminInvoiceDetail]:
        inv = await self.repo.get_invoice_by_id(invoice_id)
        if not inv:
            return None
        return self._map_invoice_detail(inv)

    async def create_invoice(
        self,
        payload: AdminInvoiceCreate,
        created_by_user_id: Optional[uuid.UUID] = None,
    ) -> AdminInvoiceDetail:
        inv = await self.repo.create_invoice(payload, created_by_user_id)
        return self._map_invoice_detail(inv)

    async def create_invoice_from_order(
        self,
        order_id: uuid.UUID,
        created_by_user_id: Optional[uuid.UUID] = None,
    ) -> AdminInvoiceDetail:
        inv = await self.repo.create_invoice_from_order(order_id, created_by_user_id)
        return self._map_invoice_detail(inv)

    async def update_invoice_status(
        self,
        invoice_id: uuid.UUID,
        payload: AdminInvoiceStatusUpdate,
    ) -> AdminInvoiceDetail:
        inv = await self.repo.update_invoice_status(invoice_id, payload)
        return self._map_invoice_detail(inv)

    async def record_payment(
        self,
        invoice_id: uuid.UUID,
        payload: AdminInvoiceRecordPaymentPayload,
        recorded_by_user_id: Optional[uuid.UUID] = None,
    ) -> AdminInvoiceDetail:
        inv = await self.repo.record_payment_for_invoice(invoice_id, payload, recorded_by_user_id)
        return self._map_invoice_detail(inv)

    async def generate_pdf(self, invoice_id: uuid.UUID) -> bytes:
        inv_detail = await self.get_invoice(invoice_id)
        if not inv_detail:
            raise ValueError(f"Invoice with ID '{invoice_id}' not found.")
        
        return generate_invoice_pdf(inv_detail.model_dump(mode="json"))
