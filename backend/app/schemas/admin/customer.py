import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.customer import CustomerType


class AdminCustomerList(BaseModel):
    id: uuid.UUID
    full_name: str
    company_name: Optional[str] = None
    customer_type: CustomerType
    phone: str
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    city: str
    state: str
    total_orders_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCustomerDetail(BaseModel):
    id: uuid.UUID
    full_name: str
    company_name: Optional[str] = None
    customer_type: CustomerType
    phone: str
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    city: str
    state: str
    shipping_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    customer_type: CustomerType = Field(CustomerType.RETAIL)
    phone: str = Field(..., min_length=7, max_length=30)
    whatsapp_number: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    gstin: Optional[str] = Field(None, max_length=20)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field("Tamil Nadu", max_length=100)
    shipping_address: Optional[str] = None


class AdminCustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    customer_type: Optional[CustomerType] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=30)
    whatsapp_number: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    gstin: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    shipping_address: Optional[str] = None
