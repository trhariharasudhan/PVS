import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product, ProductImage, AvailabilityStatus
from app.models.category import Category
from app.models.inventory import Inventory
from app.schemas.admin.product import (
    AdminProductCreate,
    AdminProductUpdate,
    AdminProductImageCreate,
    AdminProductImageUpdate,
)


class AdminProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        availability: Optional[str] = None,
        featured: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Product], int]:
        """Admin listing including both active and deactivated products with filters."""
        base_query = (
            select(Product)
            .join(Product.category)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )

        if category_id:
            base_query = base_query.where(Product.category_id == category_id)

        if is_active is not None:
            base_query = base_query.where(Product.is_active.is_(is_active))

        if availability:
            try:
                status_enum = AvailabilityStatus(availability.upper().strip())
                base_query = base_query.where(Product.availability_status == status_enum)
            except ValueError:
                pass

        if featured is not None:
            base_query = base_query.where(Product.is_featured.is_(featured))

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

        # Sort newest first
        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Product.updated_at.desc(), Product.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        products = list(result.scalars().all())
        return products, total_count

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[Product]:
        """Retrieve single product by UUID for admin management."""
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_code(self, code: str) -> Optional[Product]:
        """Lookup by exact or case-insensitive product code."""
        query = select(Product).where(Product.code.ilike(code.strip()))
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: AdminProductCreate) -> Product:
        """Create a new product with optional initial image and inventory records."""
        prod = Product(
            id=uuid.uuid4(),
            code=data.code.strip().upper(),
            name=data.name.strip(),
            category_id=data.category_id,
            fabric=data.fabric.strip(),
            color=data.color.strip(),
            border=data.border.strip(),
            pallu=data.pallu.strip() if data.pallu else None,
            motif=data.motif.strip() if data.motif else None,
            weave_type=data.weave_type.strip(),
            description=data.description.strip(),
            detailed_story=data.detailed_story.strip() if data.detailed_story else None,
            price=data.price,
            currency=data.currency.strip().upper(),
            is_price_on_enquiry=data.is_price_on_enquiry,
            price_note=data.price_note.strip() if data.price_note else None,
            availability_status=data.availability_status,
            saree_length_meters=data.saree_length_meters,
            blouse_piece_description=data.blouse_piece_description.strip() if data.blouse_piece_description else None,
            weight_approx_grams=data.weight_approx_grams,
            care_instructions=data.care_instructions,
            is_featured=data.is_featured,
            is_new_arrival=data.is_new_arrival,
            is_active=data.is_active,
        )
        self.session.add(prod)
        await self.session.flush()

        # Add initial images if provided
        if data.images:
            for idx, img_data in enumerate(data.images, start=1):
                img = ProductImage(
                    id=uuid.uuid4(),
                    product_id=prod.id,
                    image_url=img_data.image_url.strip(),
                    alt_text=img_data.alt_text.strip() if img_data.alt_text else prod.name,
                    tag=img_data.tag.strip() if img_data.tag else "Full Saree",
                    display_order=img_data.display_order or idx,
                    is_primary=img_data.is_primary if img_data.is_primary is not None else (idx == 1),
                )
                self.session.add(img)

        # Initialize base inventory record
        inv = Inventory(
            id=uuid.uuid4(),
            product_id=prod.id,
            quantity_on_hand=0,
            quantity_reserved=0,
            reorder_threshold=3,
        )
        self.session.add(inv)

        await self.session.commit()
        return await self.get_by_id(prod.id)

    async def update(self, product: Product, data: AdminProductUpdate) -> Product:
        """Perform partial update on a product."""
        update_dict = data.model_dump(exclude_unset=True)

        if "code" in update_dict and update_dict["code"]:
            product.code = update_dict["code"].strip().upper()
        if "name" in update_dict and update_dict["name"]:
            product.name = update_dict["name"].strip()
        if "category_id" in update_dict and update_dict["category_id"]:
            product.category_id = update_dict["category_id"]
        if "fabric" in update_dict and update_dict["fabric"]:
            product.fabric = update_dict["fabric"].strip()
        if "color" in update_dict and update_dict["color"]:
            product.color = update_dict["color"].strip()
        if "border" in update_dict and update_dict["border"]:
            product.border = update_dict["border"].strip()
        if "pallu" in update_dict:
            product.pallu = update_dict["pallu"].strip() if update_dict["pallu"] else None
        if "motif" in update_dict:
            product.motif = update_dict["motif"].strip() if update_dict["motif"] else None
        if "weave_type" in update_dict and update_dict["weave_type"]:
            product.weave_type = update_dict["weave_type"].strip()
        if "description" in update_dict and update_dict["description"]:
            product.description = update_dict["description"].strip()
        if "detailed_story" in update_dict:
            product.detailed_story = update_dict["detailed_story"].strip() if update_dict["detailed_story"] else None
        if "price" in update_dict:
            product.price = update_dict["price"]
        if "currency" in update_dict and update_dict["currency"]:
            product.currency = update_dict["currency"].strip().upper()
        if "is_price_on_enquiry" in update_dict:
            product.is_price_on_enquiry = update_dict["is_price_on_enquiry"]
        if "price_note" in update_dict:
            product.price_note = update_dict["price_note"].strip() if update_dict["price_note"] else None
        if "availability_status" in update_dict and update_dict["availability_status"]:
            product.availability_status = update_dict["availability_status"]
        if "saree_length_meters" in update_dict and update_dict["saree_length_meters"]:
            product.saree_length_meters = update_dict["saree_length_meters"]
        if "blouse_piece_description" in update_dict:
            product.blouse_piece_description = update_dict["blouse_piece_description"].strip() if update_dict["blouse_piece_description"] else None
        if "weight_approx_grams" in update_dict:
            product.weight_approx_grams = update_dict["weight_approx_grams"]
        if "care_instructions" in update_dict:
            product.care_instructions = update_dict["care_instructions"]
        if "is_featured" in update_dict:
            product.is_featured = update_dict["is_featured"]
        if "is_new_arrival" in update_dict:
            product.is_new_arrival = update_dict["is_new_arrival"]
        if "is_active" in update_dict:
            product.is_active = update_dict["is_active"]

        await self.session.commit()
        return await self.get_by_id(product.id)

    async def soft_delete(self, product: Product) -> Product:
        """Deactivates a product rather than destructive deletion."""
        product.is_active = False
        await self.session.commit()
        return await self.get_by_id(product.id)

    # --- Product Image Management ---

    async def add_image(self, product_id: uuid.UUID, data: AdminProductImageCreate) -> ProductImage:
        """Add new photography metadata to a product."""
        # If marked primary, unset other primaries
        if data.is_primary:
            await self.session.execute(
                update(ProductImage)
                .where(ProductImage.product_id == product_id)
                .values(is_primary=False)
            )

        img = ProductImage(
            id=uuid.uuid4(),
            product_id=product_id,
            image_url=data.image_url.strip(),
            alt_text=data.alt_text.strip() if data.alt_text else None,
            tag=data.tag.strip() if data.tag else "Full Saree",
            display_order=data.display_order,
            is_primary=data.is_primary,
        )
        self.session.add(img)
        await self.session.commit()
        await self.session.refresh(img)
        return img

    async def update_image(self, image_id: uuid.UUID, data: AdminProductImageUpdate) -> Optional[ProductImage]:
        """Update an image's display attributes."""
        query = select(ProductImage).where(ProductImage.id == image_id)
        result = await self.session.execute(query)
        img = result.scalars().first()
        if not img:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if "image_url" in update_dict and update_dict["image_url"]:
            img.image_url = update_dict["image_url"].strip()
        if "alt_text" in update_dict:
            img.alt_text = update_dict["alt_text"].strip() if update_dict["alt_text"] else None
        if "tag" in update_dict:
            img.tag = update_dict["tag"].strip() if update_dict["tag"] else None
        if "display_order" in update_dict and update_dict["display_order"] is not None:
            img.display_order = update_dict["display_order"]
        if "is_primary" in update_dict and update_dict["is_primary"] is not None:
            if update_dict["is_primary"]:
                # Unset other primaries for this product
                await self.session.execute(
                    update(ProductImage)
                    .where(ProductImage.product_id == img.product_id)
                    .values(is_primary=False)
                )
            img.is_primary = update_dict["is_primary"]

        await self.session.commit()
        await self.session.refresh(img)
        return img

    async def delete_image(self, image_id: uuid.UUID) -> bool:
        """Remove an image metadata entry."""
        query = select(ProductImage).where(ProductImage.id == image_id)
        result = await self.session.execute(query)
        img = result.scalars().first()
        if not img:
            return False

        await self.session.delete(img)
        await self.session.commit()
        return True
