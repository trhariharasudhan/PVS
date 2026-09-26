import uuid
from decimal import Decimal
from typing import List, Dict, Any
from datetime import date, timedelta
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.payment import Payment, PaymentType, PaymentRecordStatus
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.purchase import PurchaseOrder, PurchaseOrderStatus
from app.schemas.admin.finance import (
    FinanceOverviewKPIs,
    CustomerOutstandingDetail,
    SupplierOutstandingDetail,
    AgingBuckets,
)


class AdminFinanceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview_kpis(self) -> FinanceOverviewKPIs:
        today = date.today()
        first_day_of_month = date(today.year, today.month, 1)
        first_day_of_year = date(today.year, 1, 1)

        # 1. Total Receivables (Unpaid balance on Tax Invoices)
        receivables_stmt = (
            select(func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")))
            .where(
                and_(
                    Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                )
            )
        )
        total_receivables = (await self.db.execute(receivables_stmt)).scalar() or Decimal("0.00")

        # 2. Total Payables (Unpaid balance on Purchase Bills & open POs)
        payables_stmt = (
            select(func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")))
            .where(
                and_(
                    Invoice.invoice_type == InvoiceType.PURCHASE_BILL,
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                )
            )
        )
        total_payables = (await self.db.execute(payables_stmt)).scalar() or Decimal("0.00")

        # If no purchase bills yet, compute from POs minus outbound payments
        if total_payables == Decimal("0.00"):
            po_total_stmt = select(func.coalesce(func.sum(PurchaseOrder.total_amount), Decimal("0.00"))).where(
                PurchaseOrder.status.in_([PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED, PurchaseOrderStatus.RECEIVED])
            )
            po_total = (await self.db.execute(po_total_stmt)).scalar() or Decimal("0.00")

            disbursed_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
                and_(
                    Payment.payment_type == PaymentType.OUTBOUND_SUPPLIER_PAYMENT,
                    Payment.payment_status == PaymentRecordStatus.CLEARED,
                )
            )
            disbursed = (await self.db.execute(disbursed_stmt)).scalar() or Decimal("0.00")
            total_payables = max(Decimal("0.00"), po_total - disbursed)

        # 3. Revenue MTD & YTD
        rev_mtd_stmt = select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(
            and_(
                Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                Invoice.invoice_date >= first_day_of_month,
                Invoice.status != InvoiceStatus.CANCELLED,
            )
        )
        gross_revenue_mtd = (await self.db.execute(rev_mtd_stmt)).scalar() or Decimal("0.00")

        rev_ytd_stmt = select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(
            and_(
                Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                Invoice.invoice_date >= first_day_of_year,
                Invoice.status != InvoiceStatus.CANCELLED,
            )
        )
        gross_revenue_ytd = (await self.db.execute(rev_ytd_stmt)).scalar() or Decimal("0.00")

        # 4. Cash Inflow vs Outflow
        inflow_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
            and_(
                Payment.payment_type == PaymentType.INBOUND_CUSTOMER_PAYMENT,
                Payment.payment_status == PaymentRecordStatus.CLEARED,
            )
        )
        total_inbound = (await self.db.execute(inflow_stmt)).scalar() or Decimal("0.00")

        outflow_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
            and_(
                Payment.payment_type == PaymentType.OUTBOUND_SUPPLIER_PAYMENT,
                Payment.payment_status == PaymentRecordStatus.CLEARED,
            )
        )
        total_outbound = (await self.db.execute(outflow_stmt)).scalar() or Decimal("0.00")
        net_cash_flow = total_inbound - total_outbound

        # 5. Tax Collected Breakdown
        tax_stmt = select(
            func.coalesce(func.sum(Invoice.cgst_amount), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.sgst_amount), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.igst_amount), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.total_tax_amount), Decimal("0.00")),
        ).where(
            and_(
                Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                Invoice.status != InvoiceStatus.CANCELLED,
            )
        )
        tax_res = (await self.db.execute(tax_stmt)).first()
        cgst_collected = tax_res[0] if tax_res else Decimal("0.00")
        sgst_collected = tax_res[1] if tax_res else Decimal("0.00")
        igst_collected = tax_res[2] if tax_res else Decimal("0.00")
        total_tax_collected = tax_res[3] if tax_res else Decimal("0.00")

        # 6. Invoice counts
        open_inv_stmt = select(func.count(Invoice.id)).where(
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID])
        )
        open_invoices_count = (await self.db.execute(open_inv_stmt)).scalar() or 0

        overdue_inv_stmt = select(func.count(Invoice.id)).where(
            and_(
                Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                Invoice.due_date < today,
            )
        )
        overdue_invoices_count = (await self.db.execute(overdue_inv_stmt)).scalar() or 0

        return FinanceOverviewKPIs(
            total_receivables=total_receivables,
            total_payables=total_payables,
            gross_revenue_mtd=gross_revenue_mtd,
            gross_revenue_ytd=gross_revenue_ytd,
            total_inbound_collected=total_inbound,
            total_outbound_disbursed=total_outbound,
            net_cash_flow=net_cash_flow,
            total_cgst_collected=cgst_collected,
            total_sgst_collected=sgst_collected,
            total_igst_collected=igst_collected,
            total_tax_collected=total_tax_collected,
            open_invoices_count=open_invoices_count,
            overdue_invoices_count=overdue_invoices_count,
        )

    async def get_customer_receivables_aging(self) -> List[CustomerOutstandingDetail]:
        today = date.today()

        # Fetch all customers with their unpaid invoices
        stmt = (
            select(Customer)
            .order_by(Customer.full_name)
        )
        customers = (await self.db.execute(stmt)).scalars().all()

        results = []
        for cust in customers:
            # Query invoices for this customer
            inv_stmt = select(Invoice).where(
                and_(
                    Invoice.customer_id == cust.id,
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
                    Invoice.balance_due > Decimal("0.00"),
                )
            )
            invoices = (await self.db.execute(inv_stmt)).scalars().all()

            if not invoices:
                continue

            total_invoiced = sum((inv.total_amount for inv in invoices), Decimal("0.00"))
            total_paid = sum((inv.paid_amount for inv in invoices), Decimal("0.00"))
            balance_due = sum((inv.balance_due for inv in invoices), Decimal("0.00"))

            oldest_date = min((inv.invoice_date for inv in invoices), default=None)

            c_0_30 = Decimal("0.00")
            c_31_60 = Decimal("0.00")
            c_61_90 = Decimal("0.00")
            c_over_90 = Decimal("0.00")

            for inv in invoices:
                days_old = (today - inv.invoice_date).days
                due = inv.balance_due
                if days_old <= 30:
                    c_0_30 += due
                elif days_old <= 60:
                    c_31_60 += due
                elif days_old <= 90:
                    c_61_90 += due
                else:
                    c_over_90 += due

            aging = AgingBuckets(
                current_0_30=c_0_30,
                days_31_60=c_31_60,
                days_61_90=c_61_90,
                over_90_days=c_over_90,
                total_outstanding=balance_due,
            )

            results.append(
                CustomerOutstandingDetail(
                    customer_id=cust.id,
                    customer_name=cust.full_name,
                    customer_code=cust.company_name,
                    customer_type=cust.customer_type,
                    phone=cust.phone,
                    city=cust.city or "Tamil Nadu",
                    total_invoiced=total_invoiced,
                    total_paid=total_paid,
                    balance_due=balance_due,
                    oldest_unpaid_date=oldest_date,
                    aging=aging,
                )
            )

        return results

    async def get_supplier_payables_aging(self) -> List[SupplierOutstandingDetail]:
        today = date.today()

        stmt = select(Supplier).where(Supplier.is_active == True).order_by(Supplier.supplier_name)
        suppliers = (await self.db.execute(stmt)).scalars().all()

        results = []
        for sup in suppliers:
            # Query POs for this supplier
            po_stmt = select(PurchaseOrder).where(
                and_(
                    PurchaseOrder.supplier_id == sup.id,
                    PurchaseOrder.status.in_([PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED, PurchaseOrderStatus.RECEIVED]),
                )
            )
            pos = (await self.db.execute(po_stmt)).scalars().all()

            if not pos:
                continue

            total_billed = sum((po.total_amount for po in pos), Decimal("0.00"))

            # Disbursed payments
            pay_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
                and_(
                    Payment.supplier_id == sup.id,
                    Payment.payment_status == PaymentRecordStatus.CLEARED,
                )
            )
            total_disbursed = (await self.db.execute(pay_stmt)).scalar() or Decimal("0.00")
            balance_payable = max(Decimal("0.00"), total_billed - total_disbursed)

            if balance_payable <= Decimal("0.00"):
                continue

            oldest_date = min((po.order_date for po in pos), default=None)

            c_0_30 = Decimal("0.00")
            c_31_60 = Decimal("0.00")
            c_61_90 = Decimal("0.00")
            c_over_90 = Decimal("0.00")

            # Simple allocation for POs
            unpaid_pool = balance_payable
            for po in sorted(pos, key=lambda x: x.order_date, reverse=True):
                if unpaid_pool <= Decimal("0.00"):
                    break
                alloc = min(unpaid_pool, po.total_amount)
                unpaid_pool -= alloc
                days_old = (today - po.order_date).days

                if days_old <= 30:
                    c_0_30 += alloc
                elif days_old <= 60:
                    c_31_60 += alloc
                elif days_old <= 90:
                    c_61_90 += alloc
                else:
                    c_over_90 += alloc

            aging = AgingBuckets(
                current_0_30=c_0_30,
                days_31_60=c_31_60,
                days_61_90=c_61_90,
                over_90_days=c_over_90,
                total_outstanding=balance_payable,
            )

            results.append(
                SupplierOutstandingDetail(
                    supplier_id=sup.id,
                    supplier_name=sup.supplier_name,
                    supplier_code=sup.supplier_code,
                    supplier_type=sup.supplier_type,
                    phone=sup.phone,
                    location=sup.location,
                    total_billed=total_billed,
                    total_disbursed=total_disbursed,
                    balance_payable=balance_payable,
                    oldest_unpaid_date=oldest_date,
                    aging=aging,
                )
            )

        return results
