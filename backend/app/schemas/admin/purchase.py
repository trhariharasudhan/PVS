import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.purchase import PurchaseOrderStatus
from app.schemas.admin.supplier import AdminSupplierDetail


class AdminPurchaseOrderItemDetail(BaseModel):
    id: uuid.UUID
    raw_material_id: uuid.UUID
    material_code: str
    material_name: str
    unit_of_measure: str
    quantity_ordered: Decimal
    quantity_received: Decimal
    unit_cost: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class AdminPurchaseOrderItemCreate(BaseModel):
    raw_material_id: uuid.UUID = Field(..., description="Target raw material UUID")
    quantity_ordered: Decimal = Field(..., gt=0, description="Quantity to purchase")
    unit_cost: Decimal = Field(..., ge=0, description="Unit purchasing rate")


class AdminPurchaseOrderList(BaseModel):
    id: uuid.UUID
    po_number: str
    supplier_id: uuid.UUID
    supplier_name: str
    supplier_code: str
    status: PurchaseOrderStatus
    order_date: date
    expected_delivery_date: Optional[date] = None
    subtotal_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    item_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminPurchaseOrderDetail(BaseModel):
    id: uuid.UUID
    po_number: str
    supplier_id: uuid.UUID
    supplier: AdminSupplierDetail
    status: PurchaseOrderStatus
    order_date: date
    expected_delivery_date: Optional[date] = None
    subtotal_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    items: List[AdminPurchaseOrderItemDetail] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminPurchaseOrderCreate(BaseModel):
    supplier_id: uuid.UUID
    order_date: date = Field(default_factory=date.today)
    expected_delivery_date: Optional[date] = None
    items: List[AdminPurchaseOrderItemCreate] = Field(..., min_length=1)
    tax_amount: Decimal = Field(Decimal("0.00"), ge=0)
    notes: Optional[str] = None


class ReceiveItemPayload(BaseModel):
    item_id: uuid.UUID
    quantity_to_receive: Decimal = Field(..., gt=0)


class AdminPurchaseOrderReceivePayload(BaseModel):
    items: List[ReceiveItemPayload] = Field(..., min_length=1)
    notes: Optional[str] = None
    warehouse_location: Optional[str] = None
