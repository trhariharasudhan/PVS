import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.invoice import InvoiceType, InvoiceStatus
from app.models.payment import PaymentMethod


class AdminInvoiceItemDetail(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    raw_material_id: Optional[uuid.UUID] = None
    item_description: str
    hsn_sac_code: str
    quantity: Decimal
    unit_of_measure: str
    unit_price: Decimal
    discount_amount: Decimal
    taxable_amount: Decimal
    gst_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class AdminInvoiceItemCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    raw_material_id: Optional[uuid.UUID] = None
    item_description: str = Field(..., min_length=2, max_length=255)
    hsn_sac_code: str = Field("5007", max_length=20)
    quantity: Decimal = Field(..., gt=0)
    unit_of_measure: str = Field("PCS", max_length=50)
    unit_price: Decimal = Field(..., ge=0)
    discount_amount: Decimal = Field(Decimal("0.00"), ge=0)
    gst_rate: Decimal = Field(Decimal("5.00"), ge=0)


class AdminInvoicePaymentSummary(BaseModel):
    id: uuid.UUID
    payment_number: str
    amount: Decimal
    payment_method: PaymentMethod
    reference_transaction_id: Optional[str] = None
    payment_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInvoiceList(BaseModel):
    id: uuid.UUID
    invoice_number: str
    invoice_type: InvoiceType
    party_name: str
    customer_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    purchase_order_id: Optional[uuid.UUID] = None
    invoice_date: date
    due_date: date
    subtotal_amount: Decimal
    total_tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    status: InvoiceStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInvoiceDetail(BaseModel):
    id: uuid.UUID
    invoice_number: str
    invoice_type: InvoiceType
    party_name: str
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    supplier_name: Optional[str] = None
    supplier_gstin: Optional[str] = None
    order_id: Optional[uuid.UUID] = None
    order_number: Optional[str] = None
    purchase_order_id: Optional[uuid.UUID] = None
    po_number: Optional[str] = None
    invoice_date: date
    due_date: date
    place_of_supply: str
    subtotal_amount: Decimal
    cgst_rate: Decimal
    cgst_amount: Decimal
    sgst_rate: Decimal
    sgst_amount: Decimal
    igst_rate: Decimal
    igst_amount: Decimal
    total_tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    status: InvoiceStatus
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    items: List[AdminInvoiceItemDetail] = Field(default_factory=list)
    payments: List[AdminInvoicePaymentSummary] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInvoiceCreate(BaseModel):
    invoice_type: InvoiceType = Field(InvoiceType.TAX_INVOICE)
    order_id: Optional[uuid.UUID] = None
    purchase_order_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    invoice_date: date = Field(default_factory=date.today)
    due_date: Optional[date] = None
    place_of_supply: str = Field("Tamil Nadu (33)")
    is_inter_state: bool = Field(False, description="True for IGST, False for CGST+SGST")
    customer_gstin: Optional[str] = None
    items: List[AdminInvoiceItemCreate] = Field(..., min_length=1)
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None


class AdminInvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
    notes: Optional[str] = None


class AdminInvoiceRecordPaymentPayload(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method: PaymentMethod = Field(PaymentMethod.BANK_TRANSFER_NEFT_RTGS)
    reference_transaction_id: Optional[str] = Field(None, max_length=100)
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None
