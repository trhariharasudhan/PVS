import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_authenticated_user, require_role
from app.models.user import User, UserRole
from app.services.admin.admin_category_service import AdminCategoryService
from app.schemas.admin.category import AdminCategory, AdminCategoryCreate, AdminCategoryUpdate

router = APIRouter()


@router.get(
    "",
    response_model=List[AdminCategory],
    summary="Admin List Categories",
    description="List all categories with live product count metrics.",
)
async def list_categories(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> List[AdminCategory]:
    service = AdminCategoryService(db)
    return await service.list_categories()


@router.post(
    "",
    response_model=AdminCategory,
    status_code=status.HTTP_201_CREATED,
    summary="Create Category",
    description="Create a new saree category with unique slug.",
)
async def create_category(
    payload: AdminCategoryCreate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminCategory:
    service = AdminCategoryService(db)
    return await service.create_category(payload)


@router.patch(
    "/{category_id}",
    response_model=AdminCategory,
    summary="Update Category",
    description="Update category name, slug, description, or ordering.",
)
async def update_category(
    category_id: uuid.UUID,
    payload: AdminCategoryUpdate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminCategory:
    service = AdminCategoryService(db)
    return await service.update_category(category_id, payload)


@router.delete(
    "/{category_id}",
    response_model=AdminCategory,
    summary="Deactivate Category",
    description="Soft-deactivates category to protect child products from being orphaned.",
)
async def deactivate_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminCategory:
    service = AdminCategoryService(db)
    return await service.deactivate_category(category_id)
