from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.wholesale_repository import WholesaleRepository
from app.schemas.wholesale import WholesaleEnquiryCreate, WholesaleEnquiryResponse


class WholesaleService:
    def __init__(self, session: AsyncSession):
        self.repo = WholesaleRepository(session)

    async def submit_enquiry(self, data: WholesaleEnquiryCreate) -> WholesaleEnquiryResponse:
        """Process and persist a B2B wholesale trade enquiry."""
        enquiry = await self.repo.create(data)
        return WholesaleEnquiryResponse(
            enquiry_id=enquiry.id,
            status="received",
            message="Your wholesale enquiry has been received. Our trade desk will contact you within 24 hours.",
        )
