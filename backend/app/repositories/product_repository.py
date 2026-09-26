import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product, ProductImage, AvailabilityStatus
from app.models.category import Category


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 12,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        availability: Optional[str] = None,
        featured: Optional[bool] = None,
        new_arrival: Optional[bool] = None,
        color: Optional[str] = None,
        motif: Optional[str] = None,
    ) -> Tuple[List[Product], int]:
        """Query products with filtering, search, and pagination."""
        base_query = (
            select(Product)
            .join(Product.category)
            .where(Product.is_active.is_(True))
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )

        # Filters
        if category_slug and category_slug.lower() != "all":
            base_query = base_query.where(Category.slug == category_slug.lower().strip())

        if availability and availability.lower() != "all":
            try:
                status_enum = AvailabilityStatus(availability.upper().strip())
                base_query = base_query.where(Product.availability_status == status_enum)
            except ValueError:
                pass

        if featured is not None:
            base_query = base_query.where(Product.is_featured.is_(featured))

        if new_arrival is not None:
            base_query = base_query.where(Product.is_new_arrival.is_(new_arrival))

        if color:
            base_query = base_query.where(Product.color.ilike(f"%{color.strip()}%"))

        if motif:
            base_query = base_query.where(Product.motif.ilike(f"%{motif.strip()}%"))

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Product.name.ilike(term),
                    Product.code.ilike(term),
                    Product.fabric.ilike(term),
                    Product.color.ilike(term),
                    Product.border.ilike(term),
                    Product.motif.ilike(term),
                    Product.description.ilike(term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(base_query.subquery())
        total_count_res = await self.session.execute(count_query)
        total_count = total_count_res.scalar() or 0

        # Paginate and order by newest/featured first
        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Product.is_featured.desc(), Product.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        products = list(result.scalars().all())
        return products, total_count

    async def get_by_id_or_code(self, id_or_code: str) -> Optional[Product]:
        """Find a single product by UUID string or unique product code."""
        query = (
            select(Product)
            .where(Product.is_active.is_(True))
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )

        # Try parsing as UUID
        try:
            val_uuid = uuid.UUID(id_or_code)
            query = query.where(Product.id == val_uuid)
        except (ValueError, AttributeError):
            # Lookup by code (case-insensitive)
            query = query.where(Product.code.ilike(id_or_code.strip()))

        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_related_products(
        self,
        category_id: uuid.UUID,
        current_product_id: uuid.UUID,
        limit: int = 3,
    ) -> List[Product]:
        """Fetch related products in the same category."""
        query = (
            select(Product)
            .where(
                Product.category_id == category_id,
                Product.id != current_product_id,
                Product.is_active.is_(True),
            )
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
            .order_by(Product.is_featured.desc(), Product.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
