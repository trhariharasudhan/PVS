import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.supplier import SupplierType


class AdminSupplierList(BaseModel):
    id: uuid.UUID
    supplier_code: str
    supplier_name: str
    supplier_type: SupplierType
    contact_person: str
    phone: str
    email: Optional[str] = None
    location: str
    is_active: bool
    materials_count: int = 0
    purchase_orders_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminSupplierDetail(BaseModel):
    id: uuid.UUID
    supplier_code: str
    supplier_name: str
    supplier_type: SupplierType
    contact_person: str
    phone: str
    email: Optional[str] = None
    location: str
    address: Optional[str] = None
    gstin: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminSupplierCreate(BaseModel):
    supplier_code: str = Field(..., min_length=2, max_length=50)
    supplier_name: str = Field(..., min_length=2, max_length=255)
    supplier_type: SupplierType = Field(SupplierType.GENERAL)
    contact_person: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=7, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    location: str = Field(..., min_length=2, max_length=150)
    address: Optional[str] = None
    gstin: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    is_active: bool = True


class AdminSupplierUpdate(BaseModel):
    supplier_name: Optional[str] = Field(None, min_length=2, max_length=255)
    supplier_type: Optional[SupplierType] = None
    contact_person: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=7, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, min_length=2, max_length=150)
    address: Optional[str] = None
    gstin: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    is_active: Optional[bool] = None
