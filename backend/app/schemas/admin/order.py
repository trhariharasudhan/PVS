import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderType, OrderStatus, PaymentStatus
from app.models.customer import CustomerType
from app.schemas.admin.customer import AdminCustomerCreate, AdminCustomerDetail


class AdminOrderItemDetail(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_code: str
    product_name: str
    category_name: str
    primary_image_url: Optional[str] = None
    unit_price: Decimal
    quantity: int
    custom_colorway_notes: Optional[str] = None
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class AdminOrderItemCreate(BaseModel):
    product_id: uuid.UUID = Field(..., description="Target saree product UUID")
    quantity: int = Field(..., ge=1, le=10000, description="Quantity of sarees")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Agreed unit price snapshot")
    custom_colorway_notes: Optional[str] = Field(None, max_length=255)


class AdminOrderList(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    customer_name: str
    customer_company: Optional[str] = None
    customer_type: CustomerType
    customer_phone: str
    order_type: OrderType
    order_status: OrderStatus
    payment_status: PaymentStatus
    subtotal_amount: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    item_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminOrderDetail(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    customer: AdminCustomerDetail
    order_type: OrderType
    order_status: OrderStatus
    payment_status: PaymentStatus
    subtotal_amount: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[AdminOrderItemDetail] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminOrderCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = Field(None, description="Existing customer ID")
    new_customer: Optional[AdminCustomerCreate] = Field(None, description="Inline new customer profile")
    order_type: OrderType = Field(OrderType.RETAIL_DIRECT)
    payment_status: PaymentStatus = Field(PaymentStatus.PENDING)
    items: List[AdminOrderItemCreate] = Field(..., min_length=1, description="Order line items")
    tax_amount: Decimal = Field(Decimal("0.00"), ge=0)
    shipping_amount: Decimal = Field(Decimal("0.00"), ge=0)
    notes: Optional[str] = None


class AdminOrderUpdate(BaseModel):
    order_status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    tracking_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
