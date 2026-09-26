from fastapi import APIRouter, status
from app.schemas.contact import ContactCreate, ContactResponse

router = APIRouter()


@router.post(
    "",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Message",
    description="Receive general inquiry or custom saree weaving requests.",
)
async def submit_contact_message(
    payload: ContactCreate,
) -> ContactResponse:
    # Safe public ingestion endpoint
    return ContactResponse(
        status="received",
        message=f"Thank you, {payload.name}. Your inquiry regarding '{payload.subject}' has been received by PVS Silk S.",
    )
