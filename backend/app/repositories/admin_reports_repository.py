from decimal import Decimal
from typing import Optional, List, Tuple
from datetime import date, datetime
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invoice import Invoice, InvoiceItem, InvoiceType, InvoiceStatus
from app.models.order import Order, OrderItem, OrderType, OrderStatus
from app.models.product import Product
from app.models.category import Category
from app.models.raw_material import RawMaterial, RawMaterialStock
from app.models.customer import Customer
from app.schemas.admin.reports import (
    SalesReportSummary,
    SalesReportRow,
    InventoryValuationReport,
    RawMaterialValuationRow,
    FinishedGoodValuationRow,
    GSTSummaryReport,
    GSTHSNSummaryRow,
)


class AdminReportsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_sales_report(
        self,
        start_date: date,
        end_date: date,
        customer_type: Optional[str] = None,
        order_type: Optional[str] = None,
    ) -> SalesReportSummary:
        filters = [
            func.date(Order.created_at) >= start_date,
            func.date(Order.created_at) <= end_date,
            Order.order_status != OrderStatus.CANCELLED,
        ]
        if customer_type:
            filters.append(Order.customer.has(Customer.customer_type == customer_type))
        if order_type:
            filters.append(Order.order_type == order_type)

        stmt = (
            select(Order)
            .options(
                joinedload(Order.customer),
                selectinload(Order.items),
            )
            .where(and_(*filters))
            .order_by(desc(Order.created_at))
        )
        orders = (await self.db.execute(stmt)).scalars().all()

        rows = []
        gross_sales = Decimal("0.00")
        total_tax = Decimal("0.00")
        net_sales = Decimal("0.00")
        retail_vol = Decimal("0.00")
        wholesale_vol = Decimal("0.00")

        for o in orders:
            cust_name = o.customer.full_name if o.customer else "Retail Client"
            cust_type = o.customer.customer_type.value if hasattr(o.customer.customer_type, "value") else str(o.customer.customer_type) if o.customer else "RETAIL"
            items_cnt = sum(it.quantity for it in o.items)
            taxable = o.subtotal_amount
            tax = (taxable * Decimal("5.00")) / Decimal("100.00")
            tot = o.total_amount

            gross_sales += tot
            total_tax += tax
            net_sales += taxable

            ot_str = o.order_type.value if hasattr(o.order_type, "value") else str(o.order_type)
            ps_str = o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status)

            if o.order_type == OrderType.WHOLESALE_BULK:
                wholesale_vol += tot
            else:
                retail_vol += tot

            rows.append(
                SalesReportRow(
                    date=o.created_at.date(),
                    order_number=o.order_number,
                    invoice_number=None,
                    customer_name=cust_name,
                    customer_type=cust_type,
                    items_count=items_cnt,
                    taxable_amount=taxable,
                    tax_amount=tax,
                    total_amount=tot,
                    payment_status=ps_str,
                    order_type=ot_str,
                )
            )

        total_orders = len(orders)
        aov = (gross_sales / Decimal(str(total_orders))) if total_orders > 0 else Decimal("0.00")

        return SalesReportSummary(
            start_date=start_date,
            end_date=end_date,
            total_orders=total_orders,
            gross_sales=gross_sales,
            total_tax_collected=total_tax,
            net_sales=net_sales,
            average_order_value=aov,
            retail_sales_volume=retail_vol,
            wholesale_sales_volume=wholesale_vol,
            rows=rows,
        )

    async def get_inventory_valuation_report(self) -> InventoryValuationReport:
        # 1. Raw Materials Valuation
        rm_stmt = (
            select(RawMaterial, RawMaterialStock)
            .join(RawMaterialStock, RawMaterial.id == RawMaterialStock.raw_material_id)
            .where(RawMaterial.is_active == True)
        )
        rm_results = (await self.db.execute(rm_stmt)).all()

        rm_rows = []
        total_rm_val = Decimal("0.00")
        for rm, stock in rm_results:
            on_hand = stock.quantity_on_hand
            unit_cost = rm.unit_cost or Decimal("0.00")
            line_val = on_hand * unit_cost
            total_rm_val += line_val

            rm_rows.append(
                RawMaterialValuationRow(
                    material_code=rm.material_code,
                    material_name=rm.name,
                    material_type=rm.material_type,
                    unit_of_measure=rm.unit_of_measure,
                    quantity_on_hand=on_hand,
                    unit_cost=unit_cost,
                    total_valuation=line_val,
                )
            )

        # 2. Finished Goods Valuation
        prod_stmt = (
            select(Product)
            .options(
                joinedload(Product.category),
                joinedload(Product.inventory),
            )
            .where(Product.is_active == True)
        )
        products = (await self.db.execute(prod_stmt)).scalars().all()

        fg_rows = []
        total_fg_val = Decimal("0.00")
        for p in products:
            on_hand = p.inventory.quantity_on_hand if p.inventory else 0
            retail_pr = p.price or Decimal("0.00")
            ws_price = retail_pr * Decimal("0.70")
            val = Decimal(str(on_hand)) * ws_price
            total_fg_val += val

            fg_rows.append(
                FinishedGoodValuationRow(
                    product_code=p.code,
                    product_name=p.name,
                    category_name=p.category.name if p.category else "Silk Sarees",
                    quantity_on_hand=on_hand,
                    wholesale_price=ws_price,
                    retail_price=retail_pr,
                    total_inventory_value=val,
                )
            )

        return InventoryValuationReport(
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            total_raw_material_valuation=total_rm_val,
            total_finished_goods_valuation=total_fg_val,
            combined_total_valuation=total_rm_val + total_fg_val,
            raw_materials=rm_rows,
            finished_goods=fg_rows,
        )

    async def get_gst_summary_report(self, start_date: date, end_date: date) -> GSTSummaryReport:
        # Invoices within date range
        stmt = (
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(
                and_(
                    Invoice.invoice_type == InvoiceType.TAX_INVOICE,
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date,
                    Invoice.status != InvoiceStatus.CANCELLED,
                )
            )
        )
        invoices = (await self.db.execute(stmt)).scalars().all()

        total_turnover = Decimal("0.00")
        total_cgst = Decimal("0.00")
        total_sgst = Decimal("0.00")
        total_igst = Decimal("0.00")
        intra_turnover = Decimal("0.00")
        inter_turnover = Decimal("0.00")

        hsn_map: dict[str, dict] = {}

        for inv in invoices:
            total_turnover += inv.subtotal_amount
            total_cgst += inv.cgst_amount
            total_sgst += inv.sgst_amount
            total_igst += inv.igst_amount

            if inv.igst_amount > Decimal("0.00"):
                inter_turnover += inv.subtotal_amount
            else:
                intra_turnover += inv.subtotal_amount

            for it in inv.items:
                code = it.hsn_sac_code
                if code not in hsn_map:
                    hsn_map[code] = {
                        "hsn_sac_code": code,
                        "description": "Woven Pure Silk Fabrics & Sarees" if code == "5007" else "Silk Materials",
                        "unit_of_measure": it.unit_of_measure,
                        "total_quantity": Decimal("0.00"),
                        "total_taxable_value": Decimal("0.00"),
                        "cgst_amount": Decimal("0.00"),
                        "sgst_amount": Decimal("0.00"),
                        "igst_amount": Decimal("0.00"),
                        "total_tax_amount": Decimal("0.00"),
                    }
                hsn_map[code]["total_quantity"] += it.quantity
                hsn_map[code]["total_taxable_value"] += it.taxable_amount
                hsn_map[code]["total_tax_amount"] += it.tax_amount

                if inv.igst_amount > Decimal("0.00"):
                    hsn_map[code]["igst_amount"] += it.tax_amount
                else:
                    half_tax = it.tax_amount / Decimal("2.00")
                    hsn_map[code]["cgst_amount"] += half_tax
                    hsn_map[code]["sgst_amount"] += half_tax

        hsn_rows = [GSTHSNSummaryRow(**data) for data in hsn_map.values()]

        return GSTSummaryReport(
            start_date=start_date,
            end_date=end_date,
            total_taxable_turnover=total_turnover,
            total_cgst=total_cgst,
            total_sgst=total_sgst,
            total_igst=total_igst,
            total_tax_liability=total_cgst + total_sgst + total_igst,
            intra_state_taxable_turnover=intra_turnover,
            inter_state_taxable_turnover=inter_turnover,
            hsn_summary=hsn_rows,
        )
