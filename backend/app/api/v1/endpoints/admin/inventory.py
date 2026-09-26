import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_inventory_service import AdminInventoryService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.inventory import (
    AdminInventoryItem,
    AdminInventoryMovement,
    AdminInventoryDetail,
    AdminInventoryAdjustmentRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminInventoryItem],
    summary="Admin List Saree Inventory",
    description="Query finished saree stock levels, threshold alerts, and warehouse locations.",
)
async def list_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    stock_status: Optional[str] = Query(None),
    low_stock_only: Optional[bool] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminInventoryItem]:
    service = AdminInventoryService(db)
    return await service.list_inventory(
        page=page,
        limit=limit,
        search=search,
        category_id=category_id,
        stock_status=stock_status,
        low_stock_only=low_stock_only,
    )


@router.get(
    "/{product_id}",
    response_model=AdminInventoryDetail,
    summary="Get Product Stock Detail",
    description="Retrieve inventory counts and recent movement ledger for a saree model.",
)
async def get_product_inventory(
    product_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminInventoryDetail:
    service = AdminInventoryService(db)
    return await service.get_inventory_detail(product_id)


@router.post(
    "/{product_id}/adjust",
    response_model=AdminInventoryDetail,
    status_code=status.HTTP_200_OK,
    summary="Adjust Saree Stock",
    description="Safely increment or decrement stock with atomic append-only movement ledger logging.",
)
async def adjust_inventory(
    product_id: uuid.UUID,
    payload: AdminInventoryAdjustmentRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminInventoryDetail:
    service = AdminInventoryService(db)
    return await service.adjust_stock(
        product_id=product_id,
        data=payload,
        user_id=current_user.id,
    )


@router.get(
    "/{product_id}/movements",
    response_model=PaginatedResponse[AdminInventoryMovement],
    summary="Get Inventory Movement Audit Ledger",
    description="Full chronological audit trail of all physical stock delta movements for a saree SKU.",
)
async def get_inventory_movements(
    product_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminInventoryMovement]:
    service = AdminInventoryService(db)
    return await service.get_movements(product_id=product_id, page=page, limit=limit)
