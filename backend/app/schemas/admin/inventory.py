import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.inventory import MovementType


class AdminInventoryMovement(BaseModel):
    id: uuid.UUID
    inventory_id: uuid.UUID
    product_id: uuid.UUID
    product_code: str
    product_name: str
    movement_type: MovementType
    quantity_delta: int
    reference_id: Optional[str] = None
    performed_by_user_id: Optional[uuid.UUID] = None
    performed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInventoryItem(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_code: str
    product_name: str
    category_name: str
    category_slug: str
    primary_image_url: Optional[str] = None
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int
    reorder_threshold: int
    warehouse_location: Optional[str] = None
    stock_status: str  # "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
    is_active: bool
    last_movement_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInventoryDetail(BaseModel):
    inventory: AdminInventoryItem
    recent_movements: List[AdminInventoryMovement] = Field(default_factory=list)


class AdminInventoryAdjustmentRequest(BaseModel):
    movement_type: MovementType = Field(..., description="Type of stock adjustment")
    quantity_delta: int = Field(..., description="Positive to add stock, negative to reduce stock (non-zero)")
    reference_id: Optional[str] = Field(None, max_length=100, description="Related Order ID or Batch ID")
    warehouse_location: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, description="Reason or audit notes for this adjustment")
