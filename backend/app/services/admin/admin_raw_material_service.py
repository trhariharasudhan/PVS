import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_raw_material_repository import AdminRawMaterialRepository
from app.models.raw_material import RawMaterial
from app.schemas.common import PaginatedResponse
from app.schemas.admin.raw_material import (
    AdminRawMaterialStockInfo,
    AdminRawMaterialMovementItem,
    AdminRawMaterialList,
    AdminRawMaterialDetail,
    AdminRawMaterialCreate,
    AdminRawMaterialUpdate,
    AdminRawMaterialAdjustmentRequest,
)


class AdminRawMaterialService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminRawMaterialRepository(session)

    def _determine_stock_status(self, on_hand: float, reorder_level: float) -> str:
        if on_hand <= 0:
            return "OUT_OF_STOCK"
        if on_hand <= reorder_level:
            return "LOW_STOCK"
        return "IN_STOCK"

    def _to_list_schema(self, mat: RawMaterial) -> AdminRawMaterialList:
        stock = mat.stock
        on_hand = stock.quantity_on_hand if stock else 0
        reserved = stock.quantity_reserved if stock else 0
        available = stock.quantity_available if stock else 0

        stock_status = self._determine_stock_status(float(on_hand), float(mat.reorder_level))

        return AdminRawMaterialList(
            id=mat.id,
            material_code=mat.material_code,
            name=mat.name,
            material_type=mat.material_type,
            unit_of_measure=mat.unit_of_measure,
            reorder_level=mat.reorder_level,
            unit_cost=mat.unit_cost,
            is_active=mat.is_active,
            supplier_id=mat.supplier_id,
            supplier_name=mat.supplier.supplier_name if mat.supplier else None,
            quantity_on_hand=on_hand,
            quantity_reserved=reserved,
            quantity_available=available,
            stock_status=stock_status,
            created_at=mat.created_at,
            updated_at=mat.updated_at,
        )

    def _to_detail_schema(self, mat: RawMaterial) -> AdminRawMaterialDetail:
        stock = mat.stock
        on_hand = stock.quantity_on_hand if stock else 0
        reserved = stock.quantity_reserved if stock else 0
        available = stock.quantity_available if stock else 0

        stock_status = self._determine_stock_status(float(on_hand), float(mat.reorder_level))

        stock_info = AdminRawMaterialStockInfo(
            quantity_on_hand=on_hand,
            quantity_reserved=reserved,
            quantity_available=available,
            reorder_level=mat.reorder_level,
            warehouse_location=stock.warehouse_location if stock else None,
            stock_status=stock_status,
            last_restocked_at=stock.last_restocked_at if stock else None,
        )

        movements = [
            AdminRawMaterialMovementItem(
                id=m.id,
                raw_material_id=m.raw_material_id,
                movement_type=m.movement_type,
                quantity_delta=m.quantity_delta,
                reference_id=m.reference_id,
                performed_by_name=m.performed_by_user.full_name if m.performed_by_user else None,
                notes=m.notes,
                created_at=m.created_at,
            )
            for m in (mat.movements or [])
        ]

        return AdminRawMaterialDetail(
            id=mat.id,
            material_code=mat.material_code,
            name=mat.name,
            material_type=mat.material_type,
            unit_of_measure=mat.unit_of_measure,
            reorder_level=mat.reorder_level,
            unit_cost=mat.unit_cost,
            description=mat.description,
            is_active=mat.is_active,
            supplier_id=mat.supplier_id,
            supplier_name=mat.supplier.supplier_name if mat.supplier else None,
            stock=stock_info,
            recent_movements=movements,
            created_at=mat.created_at,
            updated_at=mat.updated_at,
        )

    async def list_materials(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        material_type: Optional[str] = None,
        low_stock_only: bool = False,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[AdminRawMaterialList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        materials, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            material_type=material_type,
            low_stock_only=low_stock_only,
            is_active=is_active,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(m) for m in materials]

        return PaginatedResponse[AdminRawMaterialList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_material(self, material_id: uuid.UUID) -> AdminRawMaterialDetail:
        mat = await self.repo.get_by_id(material_id)
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Raw material with ID '{material_id}' was not found.",
            )
        return self._to_detail_schema(mat)

    async def create_material(
        self, data: AdminRawMaterialCreate, user_id: Optional[uuid.UUID] = None
    ) -> AdminRawMaterialDetail:
        try:
            mat = await self.repo.create(data, user_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(mat)

    async def update_material(
        self, material_id: uuid.UUID, data: AdminRawMaterialUpdate
    ) -> AdminRawMaterialDetail:
        mat = await self.repo.get_by_id(material_id)
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Raw material with ID '{material_id}' was not found.",
            )
        updated = await self.repo.update(mat, data)
        return self._to_detail_schema(updated)

    async def adjust_stock(
        self,
        material_id: uuid.UUID,
        payload: AdminRawMaterialAdjustmentRequest,
        user_id: Optional[uuid.UUID] = None,
    ) -> AdminRawMaterialDetail:
        try:
            updated = await self.repo.adjust_stock(
                material_id=material_id,
                movement_type=payload.movement_type,
                quantity_delta=payload.quantity_delta,
                reference_id=payload.reference_id,
                user_id=user_id,
                notes=payload.notes,
                warehouse_location=payload.warehouse_location,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(updated)
