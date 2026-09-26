import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_purchase_service import AdminPurchaseService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.purchase import (
    AdminPurchaseOrderList,
    AdminPurchaseOrderDetail,
    AdminPurchaseOrderCreate,
    AdminPurchaseOrderReceivePayload,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminPurchaseOrderList],
    summary="Admin List Purchase Orders",
    description="List procurement orders from yarn spinning mills and zari manufacturers.",
)
async def list_purchases(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    status: Optional[str] = Query(None),
    supplier_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminPurchaseOrderList]:
    service = AdminPurchaseService(db)
    return await service.list_purchases(
        page=page,
        limit=limit,
        status_filter=status,
        supplier_id=supplier_id,
        search=search,
    )


@router.post(
    "",
    response_model=AdminPurchaseOrderDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Purchase Order",
    description="Generate a purchase order for raw silk yarns, zari cones, or dyes.",
)
async def create_purchase(
    payload: AdminPurchaseOrderCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminPurchaseOrderDetail:
    service = AdminPurchaseService(db)
    return await service.create_purchase(payload, user_id=current_user.id)


@router.get(
    "/{po_id}",
    response_model=AdminPurchaseOrderDetail,
    summary="Get Purchase Order Detail",
    description="Retrieve purchase order specification, item breakdown, and delivery status.",
)
async def get_purchase(
    po_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminPurchaseOrderDetail:
    service = AdminPurchaseService(db)
    return await service.get_purchase(po_id)


@router.post(
    "/{po_id}/receive",
    response_model=AdminPurchaseOrderDetail,
    summary="Receive Materials from Purchase Order",
    description="Atomically credit raw material stock and log PURCHASE_RECEIPT ledger entry.",
)
async def receive_purchase_materials(
    po_id: uuid.UUID,
    payload: AdminPurchaseOrderReceivePayload,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminPurchaseOrderDetail:
    service = AdminPurchaseService(db)
    return await service.receive_items(po_id, payload, user_id=current_user.id)
