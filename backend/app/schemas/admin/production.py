import uuid
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.production import BatchStatus, StageStatus


class AdminProductionStage(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    stage_sequence: int
    stage_name: str
    status: StageStatus
    inspected_by: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminProductionStageCreate(BaseModel):
    stage_sequence: int = Field(..., ge=1)
    stage_name: str = Field(..., min_length=2, max_length=100)
    status: StageStatus = Field(StageStatus.PENDING)
    notes: Optional[str] = None


class AdminProductionStageUpdate(BaseModel):
    status: Optional[StageStatus] = None
    inspected_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


class AdminProductionBatchList(BaseModel):
    id: uuid.UUID
    batch_number: str
    product_id: uuid.UUID
    product_code: str
    product_name: str
    category_name: str
    loom_identifier: Optional[str] = None
    planned_quantity: int
    completed_quantity: int
    status: BatchStatus
    progress_percent: int
    current_stage_name: Optional[str] = None
    start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductionBatchDetail(BaseModel):
    id: uuid.UUID
    batch_number: str
    product_id: uuid.UUID
    product_code: str
    product_name: str
    category_name: str
    loom_identifier: Optional[str] = None
    planned_quantity: int
    completed_quantity: int
    status: BatchStatus
    progress_percent: int
    start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    stages: List[AdminProductionStage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductionBatchCreate(BaseModel):
    batch_number: str = Field(..., min_length=2, max_length=50, description="Unique batch SKU/Number e.g. PVS-BATCH-001")
    product_id: uuid.UUID = Field(..., description="Target saree product UUID")
    loom_identifier: Optional[str] = Field(None, max_length=50, description="e.g. Master Loom 04")
    planned_quantity: int = Field(..., ge=1, le=10000, description="Planned sarees to weave")
    start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    stages: Optional[List[AdminProductionStageCreate]] = None


class AdminProductionBatchUpdate(BaseModel):
    loom_identifier: Optional[str] = Field(None, max_length=50)
    planned_quantity: Optional[int] = Field(None, ge=1, le=10000)
    completed_quantity: Optional[int] = Field(None, ge=0, le=10000)
    status: Optional[BatchStatus] = None
    start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
