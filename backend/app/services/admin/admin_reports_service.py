import csv
import io
from decimal import Decimal
from typing import Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_reports_repository import AdminReportsRepository
from app.schemas.admin.reports import (
    SalesReportSummary,
    InventoryValuationReport,
    GSTSummaryReport,
)


class AdminReportsService:
    def __init__(self, db: AsyncSession):
        self.repo = AdminReportsRepository(db)

    async def get_sales_report(
        self,
        start_date: date,
        end_date: date,
        customer_type: Optional[str] = None,
        order_type: Optional[str] = None,
    ) -> SalesReportSummary:
        return await self.repo.get_sales_report(
            start_date=start_date,
            end_date=end_date,
            customer_type=customer_type,
            order_type=order_type,
        )

    async def export_sales_csv(
        self,
        start_date: date,
        end_date: date,
        customer_type: Optional[str] = None,
        order_type: Optional[str] = None,
    ) -> str:
        report = await self.get_sales_report(start_date, end_date, customer_type, order_type)
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Order Date",
            "Order Number",
            "Customer Name",
            "Customer Type",
            "Channel Type",
            "Items Count",
            "Taxable Amount (INR)",
            "GST Amount (INR)",
            "Total Amount (INR)",
            "Payment Status",
        ])

        for row in report.rows:
            writer.writerow([
                row.date.strftime("%Y-%m-%d"),
                row.order_number,
                row.customer_name,
                row.customer_type,
                row.order_type,
                row.items_count,
                f"{row.taxable_amount:.2f}",
                f"{row.tax_amount:.2f}",
                f"{row.total_amount:.2f}",
                row.payment_status,
            ])

        # Summary footer
        writer.writerow([])
        writer.writerow(["SUMMARY TOTALS"])
        writer.writerow(["Total Orders", report.total_orders])
        writer.writerow(["Gross Sales (INR)", f"{report.gross_sales:.2f}"])
        writer.writerow(["Total GST Collected (INR)", f"{report.total_tax_collected:.2f}"])
        writer.writerow(["Net Sales (INR)", f"{report.net_sales:.2f}"])
        writer.writerow(["Average Order Value (INR)", f"{report.average_order_value:.2f}"])

        return output.getvalue()

    async def get_inventory_valuation(self) -> InventoryValuationReport:
        return await self.repo.get_inventory_valuation_report()

    async def export_inventory_valuation_csv(self) -> str:
        report = await self.get_inventory_valuation()
        output = io.StringIO()
        writer = csv.writer(output)

        # Section 1: Raw Materials
        writer.writerow(["=== RAW MATERIAL INVENTORY VALUATION ==="])
        writer.writerow([
            "Material Code",
            "Material Name",
            "Category",
            "Unit of Measure",
            "Quantity On Hand",
            "Unit Cost Rate (INR)",
            "Valuation (INR)",
        ])

        for rm in report.raw_materials:
            writer.writerow([
                rm.material_code,
                rm.material_name,
                rm.material_type,
                rm.unit_of_measure,
                f"{rm.quantity_on_hand:.2f}",
                f"{rm.unit_cost:.2f}",
                f"{rm.total_valuation:.2f}",
            ])

        writer.writerow([])
        writer.writerow(["Total Raw Material Stock Valuation (INR)", f"{report.total_raw_material_valuation:.2f}"])
        writer.writerow([])

        # Section 2: Finished Goods
        writer.writerow(["=== FINISHED GOODS / SAREE INVENTORY VALUATION ==="])
        writer.writerow([
            "Product SKU",
            "Product Title",
            "Category",
            "On-Hand Pcs",
            "Wholesale Rate (INR)",
            "Retail Price (INR)",
            "Valuation (INR)",
        ])

        for fg in report.finished_goods:
            writer.writerow([
                fg.product_code,
                fg.product_name,
                fg.category_name,
                fg.quantity_on_hand,
                f"{fg.wholesale_price:.2f}",
                f"{fg.retail_price:.2f}",
                f"{fg.total_inventory_value:.2f}",
            ])

        writer.writerow([])
        writer.writerow(["Total Finished Goods Stock Valuation (INR)", f"{report.total_finished_goods_valuation:.2f}"])
        writer.writerow(["COMBINED TOTAL INVENTORY ASSET VALUE (INR)", f"{report.combined_total_valuation:.2f}"])

        return output.getvalue()

    async def get_gst_summary(self, start_date: date, end_date: date) -> GSTSummaryReport:
        return await self.repo.get_gst_summary_report(start_date, end_date)

    async def export_gst_csv(self, start_date: date, end_date: date) -> str:
        report = await self.get_gst_summary(start_date, end_date)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([f"=== PVS SILK S GST REPORT ({start_date} to {end_date}) ==="])
        writer.writerow(["Total Taxable Turnover (INR)", f"{report.total_taxable_turnover:.2f}"])
        writer.writerow(["Total CGST (INR)", f"{report.total_cgst:.2f}"])
        writer.writerow(["Total SGST (INR)", f"{report.total_sgst:.2f}"])
        writer.writerow(["Total IGST (INR)", f"{report.total_igst:.2f}"])
        writer.writerow(["Total GST Liability (INR)", f"{report.total_tax_liability:.2f}"])
        writer.writerow([])
        writer.writerow(["HSN/SAC SUMMARY BREAKDOWN (GSTR-1 TABLE 12)"])
        writer.writerow([
            "HSN/SAC Code",
            "Description",
            "UOM",
            "Total Quantity",
            "Taxable Value (INR)",
            "CGST (INR)",
            "SGST (INR)",
            "IGST (INR)",
            "Total Tax (INR)",
        ])

        for h in report.hsn_summary:
            writer.writerow([
                h.hsn_sac_code,
                h.description,
                h.unit_of_measure,
                f"{h.total_quantity:.2f}",
                f"{h.total_taxable_value:.2f}",
                f"{h.cgst_amount:.2f}",
                f"{h.sgst_amount:.2f}",
                f"{h.igst_amount:.2f}",
                f"{h.total_tax_amount:.2f}",
            ])

        return output.getvalue()
