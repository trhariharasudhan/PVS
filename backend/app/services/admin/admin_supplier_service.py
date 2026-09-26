import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_supplier_repository import AdminSupplierRepository
from app.schemas.common import PaginatedResponse
from app.schemas.admin.supplier import (
    AdminSupplierList,
    AdminSupplierDetail,
    AdminSupplierCreate,
    AdminSupplierUpdate,
)


class AdminSupplierService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminSupplierRepository(session)

    async def list_suppliers(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        supplier_type: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[AdminSupplierList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        rows, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            supplier_type=supplier_type,
            is_active=is_active,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [
            AdminSupplierList(
                id=s.id,
                supplier_code=s.supplier_code,
                supplier_name=s.supplier_name,
                supplier_type=s.supplier_type,
                contact_person=s.contact_person,
                phone=s.phone,
                email=s.email,
                location=s.location,
                is_active=s.is_active,
                materials_count=m_count,
                purchase_orders_count=po_count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s, m_count, po_count in rows
        ]

        return PaginatedResponse[AdminSupplierList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_supplier(self, supplier_id: uuid.UUID) -> AdminSupplierDetail:
        supplier = await self.repo.get_by_id(supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID '{supplier_id}' was not found.",
            )
        return AdminSupplierDetail.model_validate(supplier)

    async def create_supplier(self, data: AdminSupplierCreate) -> AdminSupplierDetail:
        try:
            supplier = await self.repo.create(data)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return AdminSupplierDetail.model_validate(supplier)

    async def update_supplier(
        self, supplier_id: uuid.UUID, data: AdminSupplierUpdate
    ) -> AdminSupplierDetail:
        supplier = await self.repo.get_by_id(supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID '{supplier_id}' was not found.",
            )
        updated = await self.repo.update(supplier, data)
        return AdminSupplierDetail.model_validate(updated)
