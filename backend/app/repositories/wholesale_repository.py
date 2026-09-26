import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus
from app.schemas.wholesale import WholesaleEnquiryCreate


class WholesaleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: WholesaleEnquiryCreate) -> WholesaleEnquiry:
        """Create and persist a new wholesale trade enquiry."""
        enquiry = WholesaleEnquiry(
            id=uuid.uuid4(),
            business_name=data.business_name.strip(),
            contact_person=data.contact_person.strip(),
            phone=data.phone.strip(),
            email=data.email.strip() if data.email else None,
            city=data.city.strip(),
            business_type=data.business_type.strip(),
            number_of_stores=data.number_of_stores.strip() if data.number_of_stores else None,
            interested_collection=data.interested_collection.strip() if data.interested_collection else None,
            expected_quantity=data.expected_quantity.strip() if data.expected_quantity else None,
            message=data.message.strip() if data.message else None,
            status=EnquiryStatus.NEW,
        )
        self.session.add(enquiry)
        await self.session.commit()
        await self.session.refresh(enquiry)
        return enquiry
