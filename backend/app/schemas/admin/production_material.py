import uuid
from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AdminProductionBatchMaterialDetail(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    raw_material_id: uuid.UUID
    material_code: str
    material_name: str
    unit_of_measure: str
    quantity_consumed: Decimal
    notes: Optional[str] = None
    performed_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductionConsumeMaterialPayload(BaseModel):
    raw_material_id: uuid.UUID = Field(..., description="Target raw material to consume")
    quantity_consumed: Decimal = Field(..., gt=0, description="Quantity consumed in production")
    notes: Optional[str] = Field(None, max_length=255)
