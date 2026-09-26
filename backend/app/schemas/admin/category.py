import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AdminCategory(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    banner_image_url: Optional[str] = None
    display_order: int
    is_active: bool
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Category Name")
    slug: str = Field(..., min_length=2, max_length=100, description="Unique URL Slug")
    tagline: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    banner_image_url: Optional[str] = Field(None, max_length=512)
    display_order: int = Field(0, ge=0)
    is_active: bool = Field(True)


class AdminCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)
    tagline: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    banner_image_url: Optional[str] = Field(None, max_length=512)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
