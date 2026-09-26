import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.product import Product
from app.schemas.admin.category import AdminCategoryCreate, AdminCategoryUpdate


class AdminCategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_with_counts(self) -> List[Tuple[Category, int]]:
        """Retrieve all categories with live product counts."""
        query = (
            select(
                Category,
                func.count(Product.id).label("product_count"),
            )
            .outerjoin(Product, Product.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.display_order.asc(), Category.name.asc())
        )
        result = await self.session.execute(query)
        return list(result.all())

    async def get_by_id(self, category_id: uuid.UUID) -> Optional[Category]:
        """Find category by ID."""
        query = select(Category).where(Category.id == category_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        """Find category by slug."""
        query = select(Category).where(Category.slug == slug.lower().strip())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: AdminCategoryCreate) -> Category:
        """Create a new category."""
        category = Category(
            id=uuid.uuid4(),
            name=data.name.strip(),
            slug=data.slug.lower().strip(),
            tagline=data.tagline.strip() if data.tagline else None,
            description=data.description.strip() if data.description else None,
            banner_image_url=data.banner_image_url.strip() if data.banner_image_url else None,
            display_order=data.display_order,
            is_active=data.is_active,
        )
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update(self, category: Category, data: AdminCategoryUpdate) -> Category:
        """Update existing category fields."""
        update_dict = data.model_dump(exclude_unset=True)

        if "name" in update_dict and update_dict["name"]:
            category.name = update_dict["name"].strip()
        if "slug" in update_dict and update_dict["slug"]:
            category.slug = update_dict["slug"].lower().strip()
        if "tagline" in update_dict:
            category.tagline = update_dict["tagline"].strip() if update_dict["tagline"] else None
        if "description" in update_dict:
            category.description = update_dict["description"].strip() if update_dict["description"] else None
        if "banner_image_url" in update_dict:
            category.banner_image_url = update_dict["banner_image_url"].strip() if update_dict["banner_image_url"] else None
        if "display_order" in update_dict and update_dict["display_order"] is not None:
            category.display_order = update_dict["display_order"]
        if "is_active" in update_dict and update_dict["is_active"] is not None:
            category.is_active = update_dict["is_active"]

        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def deactivate(self, category: Category) -> Category:
        """Soft-deactivates category."""
        category.is_active = False
        await self.session.commit()
        await self.session.refresh(category)
        return category
