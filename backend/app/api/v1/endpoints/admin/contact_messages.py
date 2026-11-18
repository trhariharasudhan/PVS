import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.contact_message import ContactMessage, ContactMessageStatus
from app.models.user import User, UserRole
from app.schemas.contact import AdminContactMessage, AdminContactMessageUpdate

router = APIRouter()
STAFF = require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)


@router.get("", response_model=List[AdminContactMessage], summary="List contact-page messages (newest first)")
async def list_messages(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(STAFF),
    db: AsyncSession = Depends(get_db),
) -> List[AdminContactMessage]:
    q = select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit)
    if status_filter:
        try:
            q = q.where(ContactMessage.status == ContactMessageStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown status")
    rows = (await db.execute(q)).scalars().all()
    return [AdminContactMessage.model_validate(r) for r in rows]


@router.patch("/{message_id}", response_model=AdminContactMessage, summary="Update a contact message status / notes")
async def update_message(
    message_id: uuid.UUID,
    payload: AdminContactMessageUpdate,
    current_user: User = Depends(STAFF),
    db: AsyncSession = Depends(get_db),
) -> AdminContactMessage:
    msg = await db.get(ContactMessage, message_id)
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if payload.status is not None:
        msg.status = ContactMessageStatus(payload.status)
    if payload.internal_notes is not None:
        msg.internal_notes = payload.internal_notes
    await db.commit()
    await db.refresh(msg)
    return AdminContactMessage.model_validate(msg)
