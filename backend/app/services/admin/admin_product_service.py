import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_product_repository import AdminProductRepository
from app.repositories.category_repository import CategoryRepository
from app.models.product import Product, ProductImage
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


class AdminProductService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminProductRepository(session)
        self.category_repo = CategoryRepository(session)

    def _to_list_schema(self, product: Product) -> AdminProductList:
        images = sorted(product.images, key=lambda i: i.display_order) if product.images else []
        primary_url = None
        if images:
            prim = next((img for img in images if img.is_primary), images[0])
            primary_url = prim.image_url

        return AdminProductList(
            id=product.id,
            code=product.code,
            name=product.name,
            category_id=product.category_id,
            category_name=product.category.name if product.category else "Uncategorized",
            category_slug=product.category.slug if product.category else "all",
            fabric=product.fabric,
            color=product.color,
            border=product.border,
            motif=product.motif,
            price=product.price,
            currency=product.currency,
            is_price_on_enquiry=product.is_price_on_enquiry,
            price_note=product.price_note,
            availability_status=product.availability_status,
            is_featured=product.is_featured,
            is_new_arrival=product.is_new_arrival,
            is_active=product.is_active,
            image_count=len(images),
            primary_image_url=primary_url,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    def _to_detail_schema(self, product: Product) -> AdminProductDetail:
        images_sorted = sorted(product.images, key=lambda i: i.display_order) if product.images else []
        image_schemas = [
            AdminProductImage(
                id=img.id,
                product_id=img.product_id,
                image_url=img.image_url,
                alt_text=img.alt_text,
                tag=img.tag,
                display_order=img.display_order,
                is_primary=img.is_primary,
                created_at=img.created_at,
            )
            for img in images_sorted
        ]

        return AdminProductDetail(
            id=product.id,
            code=product.code,
            name=product.name,
            category_id=product.category_id,
            category_name=product.category.name if product.category else "Uncategorized",
            category_slug=product.category.slug if product.category else "all",
            fabric=product.fabric,
            color=product.color,
            border=product.border,
            pallu=product.pallu,
            motif=product.motif,
            weave_type=product.weave_type,
            description=product.description,
            detailed_story=product.detailed_story,
            price=product.price,
            currency=product.currency,
            is_price_on_enquiry=product.is_price_on_enquiry,
            price_note=product.price_note,
            availability_status=product.availability_status,
            saree_length_meters=product.saree_length_meters,
            blouse_piece_description=product.blouse_piece_description,
            weight_approx_grams=product.weight_approx_grams,
            care_instructions=product.care_instructions,
            is_featured=product.is_featured,
            is_new_arrival=product.is_new_arrival,
            is_active=product.is_active,
            images=image_schemas,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    async def list_products(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        availability: Optional[str] = None,
        featured: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[AdminProductList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        products, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            category_id=category_id,
            availability=availability,
            featured=featured,
            is_active=is_active,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(p) for p in products]

        return PaginatedResponse[AdminProductList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_product(self, product_id: uuid.UUID) -> AdminProductDetail:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )
        return self._to_detail_schema(product)

    async def create_product(self, data: AdminProductCreate) -> AdminProductDetail:
        # Validate unique code
        existing_code = await self.repo.get_by_code(data.code)
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with code '{data.code.upper()}' already exists. SKU codes must be unique.",
            )

        # Validate category exists
        cat = await self.category_repo.get_by_id(data.category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID '{data.category_id}' does not exist.",
            )

        created = await self.repo.create(data)
        return self._to_detail_schema(created)

    async def update_product(self, product_id: uuid.UUID, data: AdminProductUpdate) -> AdminProductDetail:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )

        # If updating code, ensure it doesn't conflict
        if data.code and data.code.strip().upper() != product.code:
            existing = await self.repo.get_by_code(data.code)
            if existing and existing.id != product.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another product with code '{data.code.upper()}' already exists.",
                )

        # If updating category, ensure it exists
        if data.category_id and data.category_id != product.category_id:
            cat = await self.category_repo.get_by_id(data.category_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID '{data.category_id}' does not exist.",
                )

        updated = await self.repo.update(product, data)
        return self._to_detail_schema(updated)

    async def deactivate_product(self, product_id: uuid.UUID) -> AdminProductDetail:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )
        deactivated = await self.repo.soft_delete(product)
        return self._to_detail_schema(deactivated)

    # --- Image sub-operations ---

    async def add_image(self, product_id: uuid.UUID, data: AdminProductImageCreate) -> AdminProductImage:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )
        img = await self.repo.add_image(product_id, data)
        return AdminProductImage(
            id=img.id,
            product_id=img.product_id,
            image_url=img.image_url,
            alt_text=img.alt_text,
            tag=img.tag,
            display_order=img.display_order,
            is_primary=img.is_primary,
            created_at=img.created_at,
        )

    async def update_image(
        self, product_id: uuid.UUID, image_id: uuid.UUID, data: AdminProductImageUpdate
    ) -> AdminProductImage:
        img = await self.repo.update_image(image_id, data)
        if not img or img.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image with ID '{image_id}' was not found for product '{product_id}'.",
            )
        return AdminProductImage(
            id=img.id,
            product_id=img.product_id,
            image_url=img.image_url,
            alt_text=img.alt_text,
            tag=img.tag,
            display_order=img.display_order,
            is_primary=img.is_primary,
            created_at=img.created_at,
        )

    async def delete_image(self, product_id: uuid.UUID, image_id: uuid.UUID) -> None:
        deleted = await self.repo.delete_image(image_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image with ID '{image_id}' was not found.",
            )
