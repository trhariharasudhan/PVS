from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.category_service import CategoryService
from app.services.product_service import ProductService
from app.schemas.category import CategoryPublic
from app.schemas.product import ProductListPublic
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[CategoryPublic],
    summary="List Active Saree Categories",
    description="Retrieve all active saree collection categories ordered by display hierarchy.",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> List[CategoryPublic]:
    service = CategoryService(db)
    return await service.get_categories()


@router.get(
    "/{slug}/products",
    response_model=PaginatedResponse[ProductListPublic],
    summary="List Sarees in Category",
    description="Retrieve paginated products belonging to a specific category slug.",
)
async def list_category_products(
    slug: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),
    availability: Optional[str] = Query(None, description="Availability status filter"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProductListPublic]:
    cat_service = CategoryService(db)
    cat = await cat_service.get_category_by_slug(slug)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' was not found.",
        )

    prod_service = ProductService(db)
    return await prod_service.get_products_paginated(
        page=page,
        limit=limit,
        category_slug=slug,
        availability=availability,
    )
