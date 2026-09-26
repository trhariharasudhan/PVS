import math
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.product_repository import ProductRepository
from app.models.product import Product, ProductImage
from app.schemas.product import (
    ProductListPublic,
    ProductDetailPublic,
    ProductImagePublic,
)
from app.schemas.common import PaginatedResponse


class ProductService:
    def __init__(self, session: AsyncSession):
        self.repo = ProductRepository(session)

    @staticmethod
    def _format_price_display(product: Product) -> str:
        """Format price display string for public view."""
        if product.is_price_on_enquiry or product.price is None:
            return "Enquire for Price"
        return f"₹{product.price:,.0f}"

    @staticmethod
    def _format_availability(product: Product) -> str:
        """Format human-readable availability state."""
        mapping = {
            "IN_STOCK": "In Stock",
            "MADE_TO_ORDER": "Made to Order",
            "LIMITED_WEAVE": "Limited Weave",
            "BULK_AVAILABLE": "Bulk Available",
            "OUT_OF_STOCK": "Out of Stock",
        }
        val = product.availability_status.value if hasattr(product.availability_status, "value") else str(product.availability_status)
        return mapping.get(val, "In Stock")

    def _to_list_schema(self, product: Product) -> ProductListPublic:
        """Map Product model to public list schema."""
        images = sorted(product.images, key=lambda img: img.display_order) if product.images else []
        primary_img = None
        secondary_img = None

        if images:
            # Find image with is_primary or fallback to first
            prim = next((img for img in images if img.is_primary), images[0])
            primary_img = ProductImagePublic(
                id=prim.id,
                image_url=prim.image_url,
                alt_text=prim.alt_text or product.name,
                tag=prim.tag,
                display_order=prim.display_order,
                is_primary=prim.is_primary,
            )
            # Find secondary image if available
            sec = next((img for img in images if img.id != prim.id), None)
            if sec:
                secondary_img = ProductImagePublic(
                    id=sec.id,
                    image_url=sec.image_url,
                    alt_text=sec.alt_text or product.name,
                    tag=sec.tag,
                    display_order=sec.display_order,
                    is_primary=sec.is_primary,
                )

        return ProductListPublic(
            id=product.id,
            code=product.code,
            name=product.name,
            category_name=product.category.name if product.category else "Silk Saree",
            category_slug=product.category.slug if product.category else "all",
            fabric=product.fabric,
            color=product.color,
            border=product.border,
            motif=product.motif,
            price_display=self._format_price_display(product),
            availability=self._format_availability(product),
            is_featured=product.is_featured,
            is_new_arrival=product.is_new_arrival,
            primary_image=primary_img,
            secondary_image=secondary_img,
        )

    async def get_products_paginated(
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
    ) -> PaginatedResponse[ProductListPublic]:
        """Fetch filtered and paginated product list."""
        page = max(1, page)
        limit = max(1, min(100, limit))

        products, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            category_slug=category_slug,
            availability=availability,
            featured=featured,
            new_arrival=new_arrival,
            color=color,
            motif=motif,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(p) for p in products]

        return PaginatedResponse[ProductListPublic](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_product_detail(self, id_or_code: str) -> Optional[ProductDetailPublic]:
        """Fetch complete public product detail and related suggestions."""
        product = await self.repo.get_by_id_or_code(id_or_code)
        if not product:
            return None

        images_sorted = sorted(product.images, key=lambda img: img.display_order) if product.images else []
        public_images = [
            ProductImagePublic(
                id=img.id,
                image_url=img.image_url,
                alt_text=img.alt_text or product.name,
                tag=img.tag,
                display_order=img.display_order,
                is_primary=img.is_primary,
            )
            for img in images_sorted
        ]

        # Fetch related products in same category
        related_db = await self.repo.get_related_products(
            category_id=product.category_id,
            current_product_id=product.id,
            limit=3,
        )
        related_public = [self._to_list_schema(rp) for rp in related_db]

        return ProductDetailPublic(
            id=product.id,
            code=product.code,
            name=product.name,
            category_id=product.category_id,
            category_name=product.category.name if product.category else "Silk Saree",
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
            price_display=self._format_price_display(product),
            price_note=product.price_note,
            availability=self._format_availability(product),
            saree_length_meters=product.saree_length_meters,
            blouse_piece_description=product.blouse_piece_description,
            weight_approx_grams=product.weight_approx_grams,
            care_instructions=product.care_instructions,
            is_featured=product.is_featured,
            is_new_arrival=product.is_new_arrival,
            images=public_images,
            related_products=related_public,
        )
