import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_supplier_service import AdminSupplierService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.supplier import (
    AdminSupplierList,
    AdminSupplierDetail,
    AdminSupplierCreate,
    AdminSupplierUpdate,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminSupplierList],
    summary="Admin List Suppliers",
    description="Query silk reelers, zari artisans, dye chemists, and packaging vendors.",
)
async def list_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    supplier_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminSupplierList]:
    service = AdminSupplierService(db)
    return await service.list_suppliers(
        page=page,
        limit=limit,
        search=search,
        supplier_type=supplier_type,
        is_active=is_active,
    )


@router.get(
    "/{supplier_id}",
    response_model=AdminSupplierDetail,
    summary="Get Supplier Detail",
    description="Retrieve supplier contact details, GSTIN, location, and notes.",
)
async def get_supplier(
    supplier_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminSupplierDetail:
    service = AdminSupplierService(db)
    return await service.get_supplier(supplier_id)


@router.post(
    "",
    response_model=AdminSupplierDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Supplier",
    description="Register a verified raw-material supplier or mill vendor.",
)
async def create_supplier(
    payload: AdminSupplierCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminSupplierDetail:
    service = AdminSupplierService(db)
    return await service.create_supplier(payload)


@router.patch(
    "/{supplier_id}",
    response_model=AdminSupplierDetail,
    summary="Update Supplier",
    description="Update supplier contact information or active/inactive status.",
)
async def update_supplier(
    supplier_id: uuid.UUID,
    payload: AdminSupplierUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminSupplierDetail:
    service = AdminSupplierService(db)
    return await service.update_supplier(supplier_id, payload)
