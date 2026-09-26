import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_purchase_repository import AdminPurchaseRepository
from app.models.purchase import PurchaseOrder
from app.schemas.common import PaginatedResponse
from app.schemas.admin.supplier import AdminSupplierDetail
from app.schemas.admin.purchase import (
    AdminPurchaseOrderItemDetail,
    AdminPurchaseOrderList,
    AdminPurchaseOrderDetail,
    AdminPurchaseOrderCreate,
    AdminPurchaseOrderReceivePayload,
)


class AdminPurchaseService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminPurchaseRepository(session)

    def _to_list_schema(self, po: PurchaseOrder) -> AdminPurchaseOrderList:
        item_count = len(po.items) if po.items else 0
        return AdminPurchaseOrderList(
            id=po.id,
            po_number=po.po_number,
            supplier_id=po.supplier_id,
            supplier_name=po.supplier.supplier_name if po.supplier else "Unknown Supplier",
            supplier_code=po.supplier.supplier_code if po.supplier else "-",
            status=po.status,
            order_date=po.order_date,
            expected_delivery_date=po.expected_delivery_date,
            subtotal_amount=po.subtotal_amount,
            tax_amount=po.tax_amount,
            total_amount=po.total_amount,
            item_count=item_count,
            created_at=po.created_at,
            updated_at=po.updated_at,
        )

    def _to_detail_schema(self, po: PurchaseOrder) -> AdminPurchaseOrderDetail:
        items_detail = []
        if po.items:
            for item in po.items:
                items_detail.append(
                    AdminPurchaseOrderItemDetail(
                        id=item.id,
                        raw_material_id=item.raw_material_id,
                        material_code=item.raw_material.material_code if item.raw_material else "-",
                        material_name=item.raw_material.name if item.raw_material else "-",
                        unit_of_measure=item.raw_material.unit_of_measure.value if item.raw_material else "-",
                        quantity_ordered=item.quantity_ordered,
                        quantity_received=item.quantity_received,
                        unit_cost=item.unit_cost,
                        line_total=item.line_total,
                    )
                )

        return AdminPurchaseOrderDetail(
            id=po.id,
            po_number=po.po_number,
            supplier_id=po.supplier_id,
            supplier=AdminSupplierDetail.model_validate(po.supplier),
            status=po.status,
            order_date=po.order_date,
            expected_delivery_date=po.expected_delivery_date,
            subtotal_amount=po.subtotal_amount,
            tax_amount=po.tax_amount,
            total_amount=po.total_amount,
            notes=po.notes,
            created_by_name=po.created_by_user.full_name if po.created_by_user else None,
            items=items_detail,
            created_at=po.created_at,
            updated_at=po.updated_at,
        )

    async def list_purchases(
        self,
        page: int = 1,
        limit: int = 15,
        status_filter: Optional[str] = None,
        supplier_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminPurchaseOrderList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        pos, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            status=status_filter,
            supplier_id=supplier_id,
            search=search,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(p) for p in pos]

        return PaginatedResponse[AdminPurchaseOrderList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_purchase(self, po_id: uuid.UUID) -> AdminPurchaseOrderDetail:
        po = await self.repo.get_by_id(po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Purchase order with ID '{po_id}' was not found.",
            )
        return self._to_detail_schema(po)

    async def create_purchase(
        self, data: AdminPurchaseOrderCreate, user_id: Optional[uuid.UUID] = None
    ) -> AdminPurchaseOrderDetail:
        items_payload = [item.model_dump() for item in data.items]
        try:
            po = await self.repo.create(
                supplier_id=data.supplier_id,
                order_date=data.order_date,
                expected_delivery_date=data.expected_delivery_date,
                items_payload=items_payload,
                tax_amount=data.tax_amount,
                notes=data.notes,
                user_id=user_id,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(po)

    async def receive_items(
        self,
        po_id: uuid.UUID,
        payload: AdminPurchaseOrderReceivePayload,
        user_id: Optional[uuid.UUID] = None,
    ) -> AdminPurchaseOrderDetail:
        receive_payloads = [item.model_dump() for item in payload.items]
        try:
            updated = await self.repo.receive_items(
                po_id=po_id,
                receive_payloads=receive_payloads,
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
