from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.product_service import ProductService
from app.schemas.product import ProductListPublic, ProductDetailPublic
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[ProductListPublic],
    summary="List Public Saree Catalogue",
    description="Retrieve paginated, filterable silk saree listings with search and category filters.",
)
async def list_products(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    limit: int = Query(12, ge=1, le=100, description="Items per page (1 to 100)"),
    search: Optional[str] = Query(None, description="Search term across name, code, fabric, or motifs"),
    category: Optional[str] = Query(None, alias="category", description="Category slug filter (e.g. pure-silk, bridal)"),
    category_slug: Optional[str] = Query(None, description="Alternative category slug parameter"),
    availability: Optional[str] = Query(None, description="Filter by availability e.g. IN_STOCK, MADE_TO_ORDER"),
    featured: Optional[bool] = Query(None, description="Filter only featured sarees"),
    new_arrival: Optional[bool] = Query(None, description="Filter only new loom arrivals"),
    color: Optional[str] = Query(None, description="Filter by color hue"),
    motif: Optional[str] = Query(None, description="Filter by traditional motif"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProductListPublic]:
    service = ProductService(db)
    effective_category = category_slug or category
    return await service.get_products_paginated(
        page=page,
        limit=limit,
        search=search,
        category_slug=effective_category,
        availability=availability,
        featured=featured,
        new_arrival=new_arrival,
        color=color,
        motif=motif,
    )


@router.get(
    "/{id_or_code}",
    response_model=ProductDetailPublic,
    summary="Get Saree Product Details",
    description="Retrieve full specifications, multi-angle images, and care instructions by UUID or product code.",
)
async def get_product_detail(
    id_or_code: str,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailPublic:
    service = ProductService(db)
    product = await service.get_product_detail(id_or_code)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saree with identifier '{id_or_code}' was not found in our active catalogue.",
        )
    return product
