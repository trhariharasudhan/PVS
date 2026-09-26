import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_category_repository import AdminCategoryRepository
from app.schemas.admin.category import AdminCategory, AdminCategoryCreate, AdminCategoryUpdate


class AdminCategoryService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminCategoryRepository(session)

    async def list_categories(self) -> List[AdminCategory]:
        tuples = await self.repo.get_all_with_counts()
        return [
            AdminCategory(
                id=c.id,
                name=c.name,
                slug=c.slug,
                tagline=c.tagline,
                description=c.description,
                banner_image_url=c.banner_image_url,
                display_order=c.display_order,
                is_active=c.is_active,
                product_count=count,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c, count in tuples
        ]

    async def create_category(self, data: AdminCategoryCreate) -> AdminCategory:
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A category with slug '{data.slug.lower()}' already exists.",
            )

        cat = await self.repo.create(data)
        return AdminCategory(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            tagline=cat.tagline,
            description=cat.description,
            banner_image_url=cat.banner_image_url,
            display_order=cat.display_order,
            is_active=cat.is_active,
            product_count=0,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
        )

    async def update_category(self, category_id: uuid.UUID, data: AdminCategoryUpdate) -> AdminCategory:
        cat = await self.repo.get_by_id(category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID '{category_id}' was not found.",
            )

        if data.slug and data.slug.lower().strip() != cat.slug:
            existing = await self.repo.get_by_slug(data.slug)
            if existing and existing.id != category_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another category with slug '{data.slug.lower()}' already exists.",
                )

        updated = await self.repo.update(cat, data)
        # Fetch fresh count
        tuples = await self.repo.get_all_with_counts()
        count = next((cnt for c, cnt in tuples if c.id == category_id), 0)

        return AdminCategory(
            id=updated.id,
            name=updated.name,
            slug=updated.slug,
            tagline=updated.tagline,
            description=updated.description,
            banner_image_url=updated.banner_image_url,
            display_order=updated.display_order,
            is_active=updated.is_active,
            product_count=count,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    async def deactivate_category(self, category_id: uuid.UUID) -> AdminCategory:
        cat = await self.repo.get_by_id(category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID '{category_id}' was not found.",
            )
        deactivated = await self.repo.deactivate(cat)
        tuples = await self.repo.get_all_with_counts()
        count = next((cnt for c, cnt in tuples if c.id == category_id), 0)

        return AdminCategory(
            id=deactivated.id,
            name=deactivated.name,
            slug=deactivated.slug,
            tagline=deactivated.tagline,
            description=deactivated.description,
            banner_image_url=deactivated.banner_image_url,
            display_order=deactivated.display_order,
            is_active=deactivated.is_active,
            product_count=count,
            created_at=deactivated.created_at,
            updated_at=deactivated.updated_at,
        )
