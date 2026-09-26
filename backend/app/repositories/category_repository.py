import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category


class CategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_active(self) -> List[Category]:
        """Retrieve all active categories ordered by display_order."""
        query = (
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.display_order.asc(), Category.name.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        """Find category by unique slug."""
        query = select(Category).where(
            Category.slug == slug.lower().strip(),
            Category.is_active.is_(True)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_id(self, category_id: uuid.UUID) -> Optional[Category]:
        """Find category by UUID."""
        query = select(Category).where(
            Category.id == category_id,
            Category.is_active.is_(True)
        )
        result = await self.session.execute(query)
        return result.scalars().first()
