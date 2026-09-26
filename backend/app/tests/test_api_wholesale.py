import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus


@pytest.mark.asyncio
async def test_submit_valid_wholesale_enquiry(async_client: AsyncClient, db_session: AsyncSession):
    """Test POST /api/v1/wholesale-enquiries successfully validates and stores enquiry."""
    payload = {
        "business_name": "Madurai Heritage Silks",
        "contact_person": "Ramanathan Chettiar",
        "phone": "+919443322110",
        "email": "ramanathan@maduraisilks.test",
        "city": "Madurai",
        "business_type": "Wholesale Showroom",
        "number_of_stores": "2-3 Outlets",
        "interested_collection": "Bridal & Pure Silk",
        "expected_quantity": "50-100 Sarees",
        "message": "Interested in regular loom allocations and festive volume pricing.",
    }

    response = await async_client.post("/api/v1/wholesale-enquiries", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "received"
    assert "enquiry_id" in data

    # Verify database persistence
    result = await db_session.execute(
        select(WholesaleEnquiry).where(WholesaleEnquiry.business_name == "Madurai Heritage Silks")
    )
    enquiry = result.scalars().first()
    assert enquiry is not None
    assert enquiry.contact_person == "Ramanathan Chettiar"
    assert enquiry.status == EnquiryStatus.NEW


@pytest.mark.asyncio
async def test_submit_invalid_wholesale_enquiry(async_client: AsyncClient):
    """Test POST /api/v1/wholesale-enquiries returns 422 on missing required fields."""
    payload = {
        "business_name": "Incomplete Boutique",
        # Missing contact_person, phone, city, business_type
    }

    response = await async_client.post("/api/v1/wholesale-enquiries", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert len(data["error"]["details"]) > 0


@pytest.mark.asyncio
async def test_submit_contact_message(async_client: AsyncClient):
    """Test POST /api/v1/contact accepts valid inquiry message."""
    payload = {
        "name": "Kavitha Sundaram",
        "phone": "+919876543210",
        "email": "kavitha@example.com",
        "subject": "Custom Colorway Inquiry for PVS-DEMO-001",
        "message": "Can this crimson saree be woven in a peacock blue body?",
    }
    response = await async_client.post("/api/v1/contact", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "received"
