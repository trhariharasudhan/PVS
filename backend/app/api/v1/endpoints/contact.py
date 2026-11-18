import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.schemas.contact import ContactCreate, ContactResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Message",
    description="Store a message from the public Contact page so PVS can reply.",
)
async def submit_contact_message(payload: ContactCreate, db: AsyncSession = Depends(get_db)) -> ContactResponse:
    if payload.website:
        # Honeypot filled → bot. Answer normally, store nothing.
        logger.info("contact honeypot triggered; message dropped")
        return ContactResponse()
    msg = ContactMessage(
        name=payload.name.strip(),
        phone=payload.phone,
        email=(payload.email or None),
        subject=payload.subject.strip() or "General Inquiry",
        message=payload.message.strip(),
        language=payload.language,
    )
    db.add(msg)
    await db.commit()
    return ContactResponse()
