import uuid
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class ProductImagePublic(BaseModel):
    id: uuid.UUID
    image_url: str
    alt_text: Optional[str] = None
    tag: Optional[str] = None
    display_order: int
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ProductListPublic(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    category_name: str
    category_slug: str
    fabric: str
    color: str
    border: str
    motif: Optional[str] = None
    price_display: str
    availability: str
    is_featured: bool
    is_new_arrival: bool
    primary_image: Optional[ProductImagePublic] = None
    secondary_image: Optional[ProductImagePublic] = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailPublic(BaseModel):
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
    price_display: str
    price_note: Optional[str] = None
    availability: str
    saree_length_meters: Decimal
    blouse_piece_description: Optional[str] = None
    weight_approx_grams: Optional[int] = None
    care_instructions: Optional[List[str]] = None
    is_featured: bool
    is_new_arrival: bool
    images: List[ProductImagePublic] = Field(default_factory=list)
    related_products: List[ProductListPublic] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
