from decimal import Decimal
from typing import List, Optional, Any
from datetime import date
from pydantic import BaseModel, Field


# 1. Sales & Revenue Report Schemas
class SalesReportRow(BaseModel):
    date: date
    order_number: str
    invoice_number: Optional[str] = None
    customer_name: str
    customer_type: str
    items_count: int
    taxable_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_status: str
    order_type: str


class SalesReportSummary(BaseModel):
    start_date: date
    end_date: date
    total_orders: int
    gross_sales: Decimal
    total_tax_collected: Decimal
    net_sales: Decimal
    average_order_value: Decimal
    retail_sales_volume: Decimal
    wholesale_sales_volume: Decimal
    rows: List[SalesReportRow]


# 2. Inventory & Production Cost Valuation Report Schemas
class RawMaterialValuationRow(BaseModel):
    material_code: str
    material_name: str
    material_type: str
    unit_of_measure: str
    quantity_on_hand: Decimal
    unit_cost: Decimal
    total_valuation: Decimal


class FinishedGoodValuationRow(BaseModel):
    product_code: str
    product_name: str
    category_name: str
    quantity_on_hand: int
    wholesale_price: Decimal
    retail_price: Decimal
    total_inventory_value: Decimal


class InventoryValuationReport(BaseModel):
    generated_at: str
    total_raw_material_valuation: Decimal
    total_finished_goods_valuation: Decimal
    combined_total_valuation: Decimal
    raw_materials: List[RawMaterialValuationRow]
    finished_goods: List[FinishedGoodValuationRow]


# 3. GST / Tax Summary Report (GSTR-1 Ready)
class GSTHSNSummaryRow(BaseModel):
    hsn_sac_code: str
    description: str
    unit_of_measure: str
    total_quantity: Decimal
    total_taxable_value: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    total_tax_amount: Decimal


class GSTSummaryReport(BaseModel):
    start_date: date
    end_date: date
    total_taxable_turnover: Decimal
    total_cgst: Decimal
    total_sgst: Decimal
    total_igst: Decimal
    total_tax_liability: Decimal
    intra_state_taxable_turnover: Decimal
    inter_state_taxable_turnover: Decimal
    hsn_summary: List[GSTHSNSummaryRow]
