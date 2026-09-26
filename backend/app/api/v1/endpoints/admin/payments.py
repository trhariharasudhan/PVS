import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_payment_service import AdminPaymentService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.payment import (
    AdminPaymentList,
    AdminPaymentDetail,
    AdminPaymentCreate,
    AdminPaymentUpdate,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminPaymentList],
    summary="Admin List Payments",
    description="List inbound client remittances and outbound supplier disbursements.",
)
async def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    payment_type: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    supplier_id: Optional[uuid.UUID] = Query(None),
    order_id: Optional[uuid.UUID] = Query(None),
    purchase_order_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminPaymentList]:
    service = AdminPaymentService(db)
    return await service.list_payments(
        page=page,
        limit=limit,
        payment_type=payment_type,
        payment_status=payment_status,
        customer_id=customer_id,
        supplier_id=supplier_id,
        order_id=order_id,
        purchase_order_id=purchase_order_id,
        search=search,
    )


@router.post(
    "",
    response_model=AdminPaymentDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Record Payment Transaction",
    description="Record NEFT/RTGS, UPI, Cheque, or Cash payment remittance against an Order or PO.",
)
async def create_payment(
    payload: AdminPaymentCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminPaymentDetail:
    service = AdminPaymentService(db)
    return await service.create_payment(payload, user_id=current_user.id)


@router.get(
    "/{payment_id}",
    response_model=AdminPaymentDetail,
    summary="Get Payment Detail",
    description="Retrieve payment transaction specification, bank reference, and ledger linkages.",
)
async def get_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminPaymentDetail:
    service = AdminPaymentService(db)
    return await service.get_payment(payment_id)


@router.patch(
    "/{payment_id}",
    response_model=AdminPaymentDetail,
    summary="Update Payment Status",
    description="Update clearance state (e.g. CLEARED, BOUNCED_FAILED, VOID) or reference UTR.",
)
async def update_payment(
    payment_id: uuid.UUID,
    payload: AdminPaymentUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminPaymentDetail:
    service = AdminPaymentService(db)
    return await service.update_payment(payment_id, payload)
