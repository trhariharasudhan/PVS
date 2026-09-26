import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoryPublic(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    banner_image_url: Optional[str] = None
    display_order: int

    model_config = ConfigDict(from_attributes=True)
