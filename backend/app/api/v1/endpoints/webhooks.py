import uuid
from typing import Optional, List, Any
from fastapi import APIRouter, Request, Depends, HTTPException, Query, status, Header
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.webhook_event import PaymentWebhookEvent, WebhookEventStatus
from app.core.webhook_security import WebhookSignatureVerificationError
from app.services.payment_webhook_service import PaymentWebhookService

router = APIRouter()


class WebhookResponse(BaseModel):
    status: str
    message: Optional[str] = None
    action: Optional[str] = None
    event_id: Optional[str] = None
    invoice_number: Optional[str] = None
    amount: Optional[float] = None
    invoice_status: Optional[str] = None
    error: Optional[str] = None


@router.post(
    "/payments/{gateway}",
    response_model=WebhookResponse,
    summary="Ingest Payment Gateway Webhook",
    description="Receive, verify HMAC signature, persist, and auto-reconcile payment events from payment gateways.",
)
async def receive_payment_webhook(
    gateway: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    x_cashfree_signature: Optional[str] = Header(None, alias="X-Cashfree-Signature"),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
) -> WebhookResponse:
    """
    Public webhook receiver endpoint for payment gateways.
    Signature is verified via HMAC-SHA256 before processing.
    """
    signature = (
        x_webhook_signature
        or x_razorpay_signature
        or x_cashfree_signature
        or x_signature
        or request.headers.get("x-webhook-signature")
        or request.headers.get("x-signature")
    )

    raw_body = await request.body()

    try:
        result = await PaymentWebhookService.process_incoming_webhook(
            db=db,
            gateway=gateway,
            raw_body=raw_body,
            signature_header=signature,
        )
        return WebhookResponse(**result)
    except WebhookSignatureVerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/events",
    summary="List Payment Webhook Events",
    description="Admin audit view of ingested payment webhook events and processing status.",
)
async def list_webhook_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    provider: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(PaymentWebhookEvent)
    if provider:
        query = query.where(PaymentWebhookEvent.provider == provider.lower())
    if status_filter:
        query = query.where(PaymentWebhookEvent.status == status_filter.upper())

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    offset = (page - 1) * limit
    paginated_q = query.order_by(PaymentWebhookEvent.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(paginated_q)
    events = list(res.scalars().all())

    items = [
        {
            "id": str(e.id),
            "provider": e.provider,
            "event_id": e.event_id,
            "event_type": e.event_type,
            "status": e.status.value,
            "signature_verified": e.signature_verified,
            "processed_at": e.processed_at.isoformat() if e.processed_at else None,
            "error_message": e.error_message,
            "retry_count": e.retry_count,
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
