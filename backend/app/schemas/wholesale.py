import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WholesaleEnquiryCreate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255, description="Name of the retail business or boutique")
    contact_person: str = Field(..., min_length=2, max_length=255, description="Primary contact name")
    phone: str = Field(..., min_length=7, max_length=30, description="Contact phone or WhatsApp number")
    email: Optional[str] = Field(None, max_length=255, description="Business email address")
    city: str = Field(..., min_length=2, max_length=100, description="City / Region")
    business_type: str = Field(..., min_length=2, max_length=100, description="Business nature e.g. Retail Showroom, Boutique")
    number_of_stores: Optional[str] = Field(None, max_length=50, description="Number of outlets")
    interested_collection: Optional[str] = Field(None, max_length=100, description="Target collection e.g. Bridal Silk")
    expected_quantity: Optional[str] = Field(None, max_length=50, description="Estimated order volume")
    message: Optional[str] = Field(None, max_length=2000, description="Custom requirements or questions")


class WholesaleEnquiryResponse(BaseModel):
    enquiry_id: uuid.UUID
    status: str
    message: str

    model_config = ConfigDict(from_attributes=True)
