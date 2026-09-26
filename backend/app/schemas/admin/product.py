import uuid
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.product import AvailabilityStatus


class AdminProductImage(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    image_url: str
    alt_text: Optional[str] = None
    tag: Optional[str] = None
    display_order: int
    is_primary: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductImageCreate(BaseModel):
    image_url: str = Field(..., min_length=5, max_length=512, description="Image URL")
    alt_text: Optional[str] = Field(None, max_length=255)
    tag: Optional[str] = Field("Full Saree", max_length=50)
    display_order: int = Field(0, ge=0)
    is_primary: bool = Field(False)


class AdminProductImageUpdate(BaseModel):
    image_url: Optional[str] = Field(None, min_length=5, max_length=512)
    alt_text: Optional[str] = Field(None, max_length=255)
    tag: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None


class AdminProductList(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    category_id: uuid.UUID
    category_name: str
    category_slug: str
    fabric: str
    color: str
    border: str
    motif: Optional[str] = None
    price: Optional[Decimal] = None
    currency: str
    is_price_on_enquiry: bool
    price_note: Optional[str] = None
    availability_status: AvailabilityStatus
    is_featured: bool
    is_new_arrival: bool
    is_active: bool
    image_count: int
    primary_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductDetail(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    category_id: uuid.UUID
    category_name: str
    category_slug: str
    fabric: str
    color: str
    border: str
    pallu: Optional[str] = None
    motif: Optional[str] = None
    weave_type: str
    description: str
    detailed_story: Optional[str] = None
    price: Optional[Decimal] = None
    currency: str
    is_price_on_enquiry: bool
    price_note: Optional[str] = None
    availability_status: AvailabilityStatus
    saree_length_meters: Decimal
    blouse_piece_description: Optional[str] = None
    weight_approx_grams: Optional[int] = None
    care_instructions: Optional[List[str]] = None
    is_featured: bool
    is_new_arrival: bool
    is_active: bool
    images: List[AdminProductImage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProductCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Unique product SKU/code e.g. PVS-001")
    name: str = Field(..., min_length=2, max_length=255, description="Saree model name")
    category_id: uuid.UUID = Field(..., description="Target category UUID")
    fabric: str = Field(..., min_length=2, max_length=150, description="Textile fabric specification")
    color: str = Field(..., min_length=2, max_length=150, description="Color description")
    border: str = Field(..., min_length=2, max_length=255, description="Border type")
    pallu: Optional[str] = Field(None, max_length=255, description="Pallu pattern")
    motif: Optional[str] = Field(None, max_length=255, description="Traditional motif")
    weave_type: str = Field("Traditional Jacquard Weave", min_length=2, max_length=150)
    description: str = Field(..., min_length=5, description="Product description")
    detailed_story: Optional[str] = Field(None, description="Extended weaving narrative")
    price: Optional[Decimal] = Field(None, ge=0, description="Commercial price")
    currency: str = Field("INR", max_length=3)
    is_price_on_enquiry: bool = Field(True)
    price_note: Optional[str] = Field(None, max_length=255)
    availability_status: AvailabilityStatus = Field(AvailabilityStatus.IN_STOCK)
    saree_length_meters: Decimal = Field(Decimal("5.50"), ge=Decimal("4.00"), le=Decimal("12.00"))
    blouse_piece_description: Optional[str] = Field("0.8 Metres Included", max_length=255)
    weight_approx_grams: Optional[int] = Field(None, ge=100, le=3000)
    care_instructions: Optional[List[str]] = Field(default_factory=lambda: ["Dry clean only", "Store wrapped in cotton cloth"])
    is_featured: bool = Field(False)
    is_new_arrival: bool = Field(False)
    is_active: bool = Field(True)
    images: Optional[List[AdminProductImageCreate]] = Field(default_factory=list)


class AdminProductUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category_id: Optional[uuid.UUID] = None
    fabric: Optional[str] = Field(None, min_length=2, max_length=150)
    color: Optional[str] = Field(None, min_length=2, max_length=150)
    border: Optional[str] = Field(None, min_length=2, max_length=255)
    pallu: Optional[str] = Field(None, max_length=255)
    motif: Optional[str] = Field(None, max_length=255)
    weave_type: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=5)
    detailed_story: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    is_price_on_enquiry: Optional[bool] = None
    price_note: Optional[str] = Field(None, max_length=255)
    availability_status: Optional[AvailabilityStatus] = None
    saree_length_meters: Optional[Decimal] = Field(None, ge=Decimal("4.00"), le=Decimal("12.00"))
    blouse_piece_description: Optional[str] = Field(None, max_length=255)
    weight_approx_grams: Optional[int] = Field(None, ge=100, le=3000)
    care_instructions: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_active: Optional[bool] = None
