import uuid
from decimal import Decimal
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, ConfigDict


class AgingBuckets(BaseModel):
    current_0_30: Decimal = Decimal("0.00")
    days_31_60: Decimal = Decimal("0.00")
    days_61_90: Decimal = Decimal("0.00")
    over_90_days: Decimal = Decimal("0.00")
    total_outstanding: Decimal = Decimal("0.00")


class CustomerOutstandingDetail(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    customer_code: Optional[str] = None
    customer_type: str
    phone: str
    city: str
    total_invoiced: Decimal
    total_paid: Decimal
    balance_due: Decimal
    oldest_unpaid_date: Optional[date] = None
    aging: AgingBuckets

    model_config = ConfigDict(from_attributes=True)


class SupplierOutstandingDetail(BaseModel):
    supplier_id: uuid.UUID
    supplier_name: str
    supplier_code: str
    supplier_type: str
    phone: str
    location: str
    total_billed: Decimal
    total_disbursed: Decimal
    balance_payable: Decimal
    oldest_unpaid_date: Optional[date] = None
    aging: AgingBuckets

    model_config = ConfigDict(from_attributes=True)


class FinanceOverviewKPIs(BaseModel):
    total_receivables: Decimal  # Outstanding from customers
    total_payables: Decimal     # Outstanding to suppliers
    gross_revenue_mtd: Decimal  # Month-to-date sales revenue
    gross_revenue_ytd: Decimal  # Year-to-date sales revenue
    total_inbound_collected: Decimal
    total_outbound_disbursed: Decimal
    net_cash_flow: Decimal
    total_cgst_collected: Decimal
    total_sgst_collected: Decimal
    total_igst_collected: Decimal
    total_tax_collected: Decimal
    open_invoices_count: int
    overdue_invoices_count: int
