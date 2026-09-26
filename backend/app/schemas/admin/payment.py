import uuid
from decimal import Decimal
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.payment import PaymentType, PaymentMethod, PaymentRecordStatus


class AdminPaymentList(BaseModel):
    id: uuid.UUID
    payment_number: str
    payment_type: PaymentType
    party_name: str
    customer_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    purchase_order_id: Optional[uuid.UUID] = None
    amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentRecordStatus
    reference_transaction_id: Optional[str] = None
    payment_date: date
    recorded_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminPaymentDetail(BaseModel):
    id: uuid.UUID
    payment_number: str
    payment_type: PaymentType
    party_name: str
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    supplier_name: Optional[str] = None
    order_id: Optional[uuid.UUID] = None
    order_number: Optional[str] = None
    purchase_order_id: Optional[uuid.UUID] = None
    po_number: Optional[str] = None
    amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentRecordStatus
    reference_transaction_id: Optional[str] = None
    payment_date: date
    notes: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminPaymentCreate(BaseModel):
    payment_type: PaymentType
    customer_id: Optional[uuid.UUID] = None
    supplier_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    purchase_order_id: Optional[uuid.UUID] = None
    amount: Decimal = Field(..., gt=0, description="Payment transaction amount")
    payment_method: PaymentMethod = Field(PaymentMethod.BANK_TRANSFER_NEFT_RTGS)
    payment_status: PaymentRecordStatus = Field(PaymentRecordStatus.RECORDED)
    reference_transaction_id: Optional[str] = Field(None, max_length=100)
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


class AdminPaymentUpdate(BaseModel):
    payment_status: Optional[PaymentRecordStatus] = None
    reference_transaction_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
