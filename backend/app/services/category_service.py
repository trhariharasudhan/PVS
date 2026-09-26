from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryPublic


class CategoryService:
    def __init__(self, session: AsyncSession):
        self.repo = CategoryRepository(session)

    async def get_categories(self) -> List[CategoryPublic]:
        """Fetch all active public categories."""
        categories = await self.repo.get_all_active()
        return [
            CategoryPublic(
                id=c.id,
                name=c.name,
                slug=c.slug,
                tagline=c.tagline,
                description=c.description,
                banner_image_url=c.banner_image_url,
                display_order=c.display_order,
            )
            for c in categories
        ]

    async def get_category_by_slug(self, slug: str) -> Optional[CategoryPublic]:
        """Fetch category details by slug."""
        cat = await self.repo.get_by_slug(slug)
        if not cat:
            return None
        return CategoryPublic(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            tagline=cat.tagline,
            description=cat.description,
            banner_image_url=cat.banner_image_url,
            display_order=cat.display_order,
        )
