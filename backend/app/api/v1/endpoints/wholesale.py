from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.wholesale_service import WholesaleService
from app.schemas.wholesale import WholesaleEnquiryCreate, WholesaleEnquiryResponse

router = APIRouter()


@router.post(
    "",
    response_model=WholesaleEnquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit B2B Wholesale Trade Enquiry",
    description="Record a new wholesale or boutique trade application for direct loom orders.",
)
async def submit_wholesale_enquiry(
    payload: WholesaleEnquiryCreate,
    db: AsyncSession = Depends(get_db),
) -> WholesaleEnquiryResponse:
    service = WholesaleService(db)
    return await service.submit_enquiry(payload)
