import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_wholesale_service import AdminWholesaleService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.order import AdminOrderDetail
from app.schemas.admin.wholesale import (
    AdminWholesaleEnquiryList,
    AdminWholesaleEnquiryDetail,
    AdminWholesaleEnquiryUpdate,
    AdminWholesaleConvertToOrderPayload,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminWholesaleEnquiryList],
    summary="Admin List Wholesale CRM Enquiries",
    description="Pipeline of inbound wholesale trade leads with conversion and negotiation states.",
)
async def list_enquiries(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminWholesaleEnquiryList]:
    service = AdminWholesaleService(db)
    return await service.list_enquiries(
        page=page,
        limit=limit,
        status_filter=status,
        search=search,
    )


@router.get(
    "/{enquiry_id}",
    response_model=AdminWholesaleEnquiryDetail,
    summary="Get Wholesale Enquiry Detail",
    description="Full B2B trade application with contact person, expected volume, and notes.",
)
async def get_enquiry(
    enquiry_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminWholesaleEnquiryDetail:
    service = AdminWholesaleService(db)
    return await service.get_enquiry(enquiry_id)


@router.patch(
    "/{enquiry_id}",
    response_model=AdminWholesaleEnquiryDetail,
    summary="Update Wholesale Enquiry State",
    description="Advance CRM pipeline state (e.g. CONTACTED, CATALOGUE_SENT, NEGOTIATING, REJECTED).",
)
async def update_enquiry(
    enquiry_id: uuid.UUID,
    payload: AdminWholesaleEnquiryUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminWholesaleEnquiryDetail:
    service = AdminWholesaleService(db)
    return await service.update_enquiry(enquiry_id, payload)


@router.post(
    "/{enquiry_id}/convert",
    response_model=AdminOrderDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Convert Wholesale Enquiry to Order",
    description="Atomically create/link customer, generate wholesale order, and reserve stock idempotently.",
)
async def convert_to_order(
    enquiry_id: uuid.UUID,
    payload: AdminWholesaleConvertToOrderPayload,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminWholesaleService(db)
    return await service.convert_to_order(enquiry_id, payload)
