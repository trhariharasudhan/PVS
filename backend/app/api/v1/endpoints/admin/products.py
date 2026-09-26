import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_authenticated_user, require_role
from app.models.user import User, UserRole
from app.services.admin.admin_product_service import AdminProductService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.product import (
    AdminProductList,
    AdminProductDetail,
    AdminProductCreate,
    AdminProductUpdate,
    AdminProductImage,
    AdminProductImageCreate,
    AdminProductImageUpdate,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminProductList],
    summary="Admin List Products",
    description="List all products including inactive items with admin attributes and image counts.",
)
async def list_admin_products(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    availability: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminProductList]:
    service = AdminProductService(db)
    return await service.list_products(
        page=page,
        limit=limit,
        search=search,
        category_id=category_id,
        availability=availability,
        featured=featured,
        is_active=is_active,
    )


@router.post(
    "",
    response_model=AdminProductDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Saree Product",
    description="Create a new saree catalogue model with unique SKU code.",
)
async def create_product(
    payload: AdminProductCreate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductDetail:
    service = AdminProductService(db)
    return await service.create_product(payload)


@router.get(
    "/{product_id}",
    response_model=AdminProductDetail,
    summary="Get Admin Product Detail",
    description="Retrieve full product specifications and image list for editing.",
)
async def get_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AdminProductDetail:
    service = AdminProductService(db)
    return await service.get_product(product_id)


@router.patch(
    "/{product_id}",
    response_model=AdminProductDetail,
    summary="Update Product",
    description="Partially update saree specifications, pricing, category, or status.",
)
async def update_product(
    product_id: uuid.UUID,
    payload: AdminProductUpdate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductDetail:
    service = AdminProductService(db)
    return await service.update_product(product_id, payload)


@router.delete(
    "/{product_id}",
    response_model=AdminProductDetail,
    summary="Deactivate/Archive Product",
    description="Soft-deactivates a product so historical order links remain intact.",
)
async def deactivate_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductDetail:
    service = AdminProductService(db)
    return await service.deactivate_product(product_id)


# --- Image Metadata Management ---


@router.post(
    "/{product_id}/images",
    response_model=AdminProductImage,
    status_code=status.HTTP_201_CREATED,
    summary="Add Product Photography Angle",
)
async def add_product_image(
    product_id: uuid.UUID,
    payload: AdminProductImageCreate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductImage:
    service = AdminProductService(db)
    return await service.add_image(product_id, payload)


@router.patch(
    "/{product_id}/images/{image_id}",
    response_model=AdminProductImage,
    summary="Update Photography Metadata",
)
async def update_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    payload: AdminProductImageUpdate,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductImage:
    service = AdminProductService(db)
    return await service.update_image(product_id, image_id, payload)


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Photography Metadata",
)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    service = AdminProductService(db)
    await service.delete_image(product_id, image_id)
    return None
