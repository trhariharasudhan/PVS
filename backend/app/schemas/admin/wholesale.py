import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.wholesale import EnquiryStatus
from app.models.order import OrderType
from app.schemas.admin.order import AdminOrderItemCreate, AdminOrderDetail


class AdminWholesaleEnquiryList(BaseModel):
    id: uuid.UUID
    business_name: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    city: str
    business_type: str
    number_of_stores: Optional[str] = None
    interested_collection: Optional[str] = None
    expected_quantity: Optional[str] = None
    status: EnquiryStatus
    assigned_to_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminWholesaleEnquiryDetail(BaseModel):
    id: uuid.UUID
    business_name: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    city: str
    business_type: str
    number_of_stores: Optional[str] = None
    interested_collection: Optional[str] = None
    expected_quantity: Optional[str] = None
    message: Optional[str] = None
    status: EnquiryStatus
    assigned_to_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    converted_order_id: Optional[uuid.UUID] = None
    converted_order_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminWholesaleEnquiryUpdate(BaseModel):
    status: Optional[EnquiryStatus] = None
    assigned_to_user_id: Optional[uuid.UUID] = None
    message: Optional[str] = None


class AdminWholesaleConvertToOrderPayload(BaseModel):
    items: List[AdminOrderItemCreate] = Field(..., min_length=1, description="Wholesale line items")
    order_type: OrderType = Field(OrderType.WHOLESALE_BULK)
    notes: Optional[str] = None
