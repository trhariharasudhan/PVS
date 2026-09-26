import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_raw_material_service import AdminRawMaterialService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.raw_material import (
    AdminRawMaterialList,
    AdminRawMaterialDetail,
    AdminRawMaterialCreate,
    AdminRawMaterialUpdate,
    AdminRawMaterialAdjustmentRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminRawMaterialList],
    summary="Admin List Raw Materials",
    description="List mulberry silk, pure zari, dyes, and loom materials with current stock levels.",
)
async def list_raw_materials(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    material_type: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminRawMaterialList]:
    service = AdminRawMaterialService(db)
    return await service.list_materials(
        page=page,
        limit=limit,
        search=search,
        material_type=material_type,
        low_stock_only=low_stock_only,
        is_active=is_active,
    )


@router.get(
    "/{material_id}",
    response_model=AdminRawMaterialDetail,
    summary="Get Raw Material Detail",
    description="Retrieve raw material specifications, stock status, and immutable movement ledger.",
)
async def get_raw_material(
    material_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminRawMaterialDetail:
    service = AdminRawMaterialService(db)
    return await service.get_material(material_id)


@router.post(
    "",
    response_model=AdminRawMaterialDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Raw Material Specification",
    description="Create raw material SKU, set reorder threshold, and initialize warehouse stock.",
)
async def create_raw_material(
    payload: AdminRawMaterialCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminRawMaterialDetail:
    service = AdminRawMaterialService(db)
    return await service.create_material(payload, user_id=current_user.id)


@router.patch(
    "/{material_id}",
    response_model=AdminRawMaterialDetail,
    summary="Update Raw Material Specification",
    description="Update reorder levels, unit costs, supplier assignment, or active status.",
)
async def update_raw_material(
    material_id: uuid.UUID,
    payload: AdminRawMaterialUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminRawMaterialDetail:
    service = AdminRawMaterialService(db)
    return await service.update_material(material_id, payload)


@router.post(
    "/{material_id}/adjust",
    response_model=AdminRawMaterialDetail,
    summary="Adjust Raw Material Stock",
    description="Perform positive/negative stock adjustment with row locking and append-only audit ledger entry.",
)
async def adjust_stock(
    material_id: uuid.UUID,
    payload: AdminRawMaterialAdjustmentRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminRawMaterialDetail:
    service = AdminRawMaterialService(db)
    return await service.adjust_stock(material_id, payload, user_id=current_user.id)
