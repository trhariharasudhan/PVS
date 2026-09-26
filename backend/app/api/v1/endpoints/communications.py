import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.communication_event import (
    CommunicationEvent,
    CommunicationChannel,
    CommunicationEventType,
    CommunicationStatus,
)
from app.services.communication_service import CommunicationDispatcherService

router = APIRouter()


class CommunicationEventResponse(BaseModel):
    id: str
    event_type: str
    channel: str
    provider: str
    recipient: str
    status: str
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None
    customer_id: Optional[str] = None
    subject: Optional[str] = None
    attempt_count: int
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None


@router.get(
    "/events",
    summary="List Dispatched Communication Events",
    description="Admin audit view of transactional communication events across Email and WhatsApp.",
)
async def list_communication_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    channel: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    event_type: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(CommunicationEvent)
    if channel:
        query = query.where(CommunicationEvent.channel == channel.upper())
    if status_filter:
        query = query.where(CommunicationEvent.status == status_filter.upper())
    if event_type:
        query = query.where(CommunicationEvent.event_type == event_type.upper())

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    offset = (page - 1) * limit
    paginated_q = query.order_by(CommunicationEvent.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(paginated_q)
    events = list(res.scalars().all())

    items = [
        {
            "id": str(e.id),
            "event_type": e.event_type.value,
            "channel": e.channel.value,
            "provider": e.provider,
            "recipient": e.recipient,
            "status": e.status.value,
            "order_id": str(e.order_id) if e.order_id else None,
            "invoice_id": str(e.invoice_id) if e.invoice_id else None,
            "customer_id": str(e.customer_id) if e.customer_id else None,
            "subject": e.subject,
            "attempt_count": e.attempt_count,
            "sent_at": e.sent_at.isoformat() if e.sent_at else None,
            "delivered_at": e.delivered_at.isoformat() if e.delivered_at else None,
            "error_message": e.error_message,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 1,
    }


@router.post(
    "/events/{event_id}/retry",
    response_model=CommunicationEventResponse,
    summary="Retry Failed Communication Event",
    description="Manually retry a failed communication dispatch with bounded attempts.",
)
async def retry_communication_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        event = await CommunicationDispatcherService.retry_event(db=db, event_id=event_id)
        return CommunicationEventResponse(
            id=str(event.id),
            event_type=event.event_type.value,
            channel=event.channel.value,
            provider=event.provider,
            recipient=event.recipient,
            status=event.status.value,
            order_id=str(event.order_id) if event.order_id else None,
            invoice_id=str(event.invoice_id) if event.invoice_id else None,
            customer_id=str(event.customer_id) if event.customer_id else None,
            subject=event.subject,
            attempt_count=event.attempt_count,
            sent_at=event.sent_at.isoformat() if event.sent_at else None,
            delivered_at=event.delivered_at.isoformat() if event.delivered_at else None,
            error_message=event.error_message,
            created_at=event.created_at.isoformat() if event.created_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
