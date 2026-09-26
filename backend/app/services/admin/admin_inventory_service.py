import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_inventory_repository import AdminInventoryRepository
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.product import Product
from app.schemas.common import PaginatedResponse
from app.schemas.admin.inventory import (
    AdminInventoryItem,
    AdminInventoryMovement,
    AdminInventoryDetail,
    AdminInventoryAdjustmentRequest,
)


class AdminInventoryService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminInventoryRepository(session)

    def _determine_stock_status(self, quantity_on_hand: int, threshold: int) -> str:
        if quantity_on_hand <= 0:
            return "OUT_OF_STOCK"
        elif quantity_on_hand <= threshold:
            return "LOW_STOCK"
        return "IN_STOCK"

    def _to_item_schema(
        self, inv: Inventory, prod: Product, last_movement_at: Optional[object] = None
    ) -> AdminInventoryItem:
        images = sorted(prod.images, key=lambda i: i.display_order) if prod.images else []
        primary_url = None
        if images:
            prim = next((img for img in images if img.is_primary), images[0])
            primary_url = prim.image_url

        stock_status = self._determine_stock_status(inv.quantity_on_hand, inv.reorder_threshold)

        return AdminInventoryItem(
            id=inv.id,
            product_id=prod.id,
            product_code=prod.code,
            product_name=prod.name,
            category_name=prod.category.name if prod.category else "General",
            category_slug=prod.category.slug if prod.category else "all",
            primary_image_url=primary_url,
            quantity_on_hand=inv.quantity_on_hand,
            quantity_reserved=inv.quantity_reserved,
            quantity_available=inv.quantity_available,
            reorder_threshold=inv.reorder_threshold,
            warehouse_location=inv.warehouse_location,
            stock_status=stock_status,
            is_active=prod.is_active,
            last_movement_at=last_movement_at,
            updated_at=inv.updated_at,
        )

    async def list_inventory(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        stock_status: Optional[str] = None,
        low_stock_only: Optional[bool] = None,
    ) -> PaginatedResponse[AdminInventoryItem]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        rows, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            category_id=category_id,
            stock_status=stock_status,
            low_stock_only=low_stock_only,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_item_schema(inv, prod, last_mov) for inv, prod, last_mov in rows]

        return PaginatedResponse[AdminInventoryItem](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_inventory_detail(self, product_id: uuid.UUID) -> AdminInventoryDetail:
        row = await self.repo.get_by_product_id(product_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory record for product '{product_id}' was not found.",
            )
        inv, prod = row

        # Fetch recent movements
        mov_tuples, _ = await self.repo.get_movements_by_product_id(product_id, page=1, limit=10)
        recent_movs = [
            AdminInventoryMovement(
                id=m.id,
                inventory_id=m.inventory_id,
                product_id=prod.id,
                product_code=prod.code,
                product_name=prod.name,
                movement_type=m.movement_type,
                quantity_delta=m.quantity_delta,
                reference_id=m.reference_id,
                performed_by_user_id=m.performed_by_user_id,
                performed_by_name=user_name,
                notes=m.notes,
                created_at=m.created_at,
            )
            for m, user_name in mov_tuples
        ]

        item_schema = self._to_item_schema(inv, prod, recent_movs[0].created_at if recent_movs else None)
        return AdminInventoryDetail(inventory=item_schema, recent_movements=recent_movs)

    async def adjust_stock(
        self,
        product_id: uuid.UUID,
        data: AdminInventoryAdjustmentRequest,
        user_id: Optional[uuid.UUID] = None,
    ) -> AdminInventoryDetail:
        try:
            inv, mov = await self.repo.adjust_stock(
                product_id=product_id,
                delta=data.quantity_delta,
                movement_type=data.movement_type,
                user_id=user_id,
                notes=data.notes,
                reference_id=data.reference_id,
                warehouse_location=data.warehouse_location,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )

        return await self.get_inventory_detail(product_id)

    async def get_movements(
        self, product_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> PaginatedResponse[AdminInventoryMovement]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        row = await self.repo.get_by_product_id(product_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )
        _, prod = row

        mov_tuples, total = await self.repo.get_movements_by_product_id(
            product_id=product_id, page=page, limit=limit
        )
        total_pages = math.ceil(total / limit) if total > 0 else 1

        items = [
            AdminInventoryMovement(
                id=m.id,
                inventory_id=m.inventory_id,
                product_id=prod.id,
                product_code=prod.code,
                product_name=prod.name,
                movement_type=m.movement_type,
                quantity_delta=m.quantity_delta,
                reference_id=m.reference_id,
                performed_by_user_id=m.performed_by_user_id,
                performed_by_name=user_name,
                notes=m.notes,
                created_at=m.created_at,
            )
            for m, user_name in mov_tuples
        ]

        return PaginatedResponse[AdminInventoryMovement](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
