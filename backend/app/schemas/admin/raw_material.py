import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.raw_material import MaterialType, UnitOfMeasure, RawMaterialMovementType


class AdminRawMaterialStockInfo(BaseModel):
    quantity_on_hand: Decimal
    quantity_reserved: Decimal
    quantity_available: Decimal
    reorder_level: Decimal
    warehouse_location: Optional[str] = None
    stock_status: str
    last_restocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminRawMaterialMovementItem(BaseModel):
    id: uuid.UUID
    raw_material_id: uuid.UUID
    movement_type: RawMaterialMovementType
    quantity_delta: Decimal
    reference_id: Optional[str] = None
    performed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRawMaterialList(BaseModel):
    id: uuid.UUID
    material_code: str
    name: str
    material_type: MaterialType
    unit_of_measure: UnitOfMeasure
    reorder_level: Decimal
    unit_cost: Optional[Decimal] = None
    is_active: bool
    supplier_id: Optional[uuid.UUID] = None
    supplier_name: Optional[str] = None
    quantity_on_hand: Decimal
    quantity_reserved: Decimal
    quantity_available: Decimal
    stock_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRawMaterialDetail(BaseModel):
    id: uuid.UUID
    material_code: str
    name: str
    material_type: MaterialType
    unit_of_measure: UnitOfMeasure
    reorder_level: Decimal
    unit_cost: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: bool
    supplier_id: Optional[uuid.UUID] = None
    supplier_name: Optional[str] = None
    stock: AdminRawMaterialStockInfo
    recent_movements: List[AdminRawMaterialMovementItem] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRawMaterialCreate(BaseModel):
    material_code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    material_type: MaterialType
    unit_of_measure: UnitOfMeasure
    reorder_level: Decimal = Field(Decimal("10.00"), ge=0)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    is_active: bool = True
    initial_stock: Decimal = Field(Decimal("0.00"), ge=0)
    warehouse_location: Optional[str] = Field(None, max_length=100)


class AdminRawMaterialUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    material_type: Optional[MaterialType] = None
    unit_of_measure: Optional[UnitOfMeasure] = None
    reorder_level: Optional[Decimal] = Field(None, ge=0)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    warehouse_location: Optional[str] = Field(None, max_length=100)


class AdminRawMaterialAdjustmentRequest(BaseModel):
    movement_type: RawMaterialMovementType = Field(RawMaterialMovementType.ADJUSTMENT)
    quantity_delta: Decimal = Field(..., description="Stock change delta (+ or -)")
    reference_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    warehouse_location: Optional[str] = Field(None, max_length=100)
