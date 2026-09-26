import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_order_service import AdminOrderService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.order import (
    AdminOrderList,
    AdminOrderDetail,
    AdminOrderCreate,
    AdminOrderUpdate,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminOrderList],
    summary="Admin List Orders",
    description="List retail and wholesale orders with status, customer, and totals.",
)
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    status: Optional[str] = Query(None),
    order_type: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminOrderList]:
    service = AdminOrderService(db)
    return await service.list_orders(
        page=page,
        limit=limit,
        status_filter=status,
        order_type=order_type,
        payment_status=payment_status,
        search=search,
    )


@router.post(
    "",
    response_model=AdminOrderDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Sales Order & Reserve Inventory",
    description="Create a sales order, snapshot unit prices, and lock available inventory.",
)
async def create_order(
    payload: AdminOrderCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.create_order(payload)


@router.get(
    "/{order_id}",
    response_model=AdminOrderDetail,
    summary="Get Order Detail",
    description="Full order specification with customer data, line item subtotals, and status.",
)
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.get_order(order_id)


@router.patch(
    "/{order_id}",
    response_model=AdminOrderDetail,
    summary="Update Order Information",
    description="Update tracking number, payment status, or order notes.",
)
async def update_order(
    order_id: uuid.UUID,
    payload: AdminOrderUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.update_order(order_id, payload, user_id=current_user.id)


@router.post(
    "/{order_id}/confirm",
    response_model=AdminOrderDetail,
    summary="Confirm Order",
    description="Advance order from PENDING to CONFIRMED status while preserving stock reservation.",
)
async def confirm_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.confirm_order(order_id)


@router.post(
    "/{order_id}/cancel",
    response_model=AdminOrderDetail,
    summary="Cancel Order & Release Inventory",
    description="Cancel an active order and idempotently release reserved stock back to available count.",
)
async def cancel_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.cancel_order(order_id)


@router.post(
    "/{order_id}/fulfill",
    response_model=AdminOrderDetail,
    summary="Fulfill Order & Record SALE Ledger",
    description="Fulfill order, deduct physical inventory on hand, and log atomic SALE movements.",
)
async def fulfill_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOrderDetail:
    service = AdminOrderService(db)
    return await service.fulfill_order(order_id, user_id=current_user.id)
