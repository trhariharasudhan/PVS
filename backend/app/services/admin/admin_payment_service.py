import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_payment_repository import AdminPaymentRepository
from app.models.payment import Payment
from app.schemas.common import PaginatedResponse
from app.schemas.admin.payment import (
    AdminPaymentList,
    AdminPaymentDetail,
    AdminPaymentCreate,
    AdminPaymentUpdate,
)


class AdminPaymentService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminPaymentRepository(session)

    def _determine_party_name(self, p: Payment) -> str:
        if p.customer:
            return p.customer.full_name + (f" ({p.customer.company_name})" if p.customer.company_name else "")
        if p.supplier:
            return p.supplier.supplier_name + f" [{p.supplier.supplier_code}]"
        return "Direct Party"

    def _to_list_schema(self, p: Payment) -> AdminPaymentList:
        return AdminPaymentList(
            id=p.id,
            payment_number=p.payment_number,
            payment_type=p.payment_type,
            party_name=self._determine_party_name(p),
            customer_id=p.customer_id,
            supplier_id=p.supplier_id,
            order_id=p.order_id,
            purchase_order_id=p.purchase_order_id,
            amount=p.amount,
            payment_method=p.payment_method,
            payment_status=p.payment_status,
            reference_transaction_id=p.reference_transaction_id,
            payment_date=p.payment_date,
            recorded_by_name=p.recorded_by_user.full_name if p.recorded_by_user else None,
            created_at=p.created_at,
        )

    def _to_detail_schema(self, p: Payment) -> AdminPaymentDetail:
        return AdminPaymentDetail(
            id=p.id,
            payment_number=p.payment_number,
            payment_type=p.payment_type,
            party_name=self._determine_party_name(p),
            customer_id=p.customer_id,
            customer_name=p.customer.full_name if p.customer else None,
            supplier_id=p.supplier_id,
            supplier_name=p.supplier.supplier_name if p.supplier else None,
            order_id=p.order_id,
            order_number=p.order.order_number if p.order else None,
            purchase_order_id=p.purchase_order_id,
            po_number=p.purchase_order.po_number if p.purchase_order else None,
            amount=p.amount,
            payment_method=p.payment_method,
            payment_status=p.payment_status,
            reference_transaction_id=p.reference_transaction_id,
            payment_date=p.payment_date,
            notes=p.notes,
            recorded_by_name=p.recorded_by_user.full_name if p.recorded_by_user else None,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    async def list_payments(
        self,
        page: int = 1,
        limit: int = 15,
        payment_type: Optional[str] = None,
        payment_status: Optional[str] = None,
        customer_id: Optional[uuid.UUID] = None,
        supplier_id: Optional[uuid.UUID] = None,
        order_id: Optional[uuid.UUID] = None,
        purchase_order_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminPaymentList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        payments, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            payment_type=payment_type,
            payment_status=payment_status,
            customer_id=customer_id,
            supplier_id=supplier_id,
            order_id=order_id,
            purchase_order_id=purchase_order_id,
            search=search,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(p) for p in payments]

        return PaginatedResponse[AdminPaymentList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_payment(self, payment_id: uuid.UUID) -> AdminPaymentDetail:
        payment = await self.repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' was not found.",
            )
        return self._to_detail_schema(payment)

    async def create_payment(
        self, data: AdminPaymentCreate, user_id: Optional[uuid.UUID] = None
    ) -> AdminPaymentDetail:
        payment = await self.repo.create(data, user_id)
        return self._to_detail_schema(payment)

    async def update_payment(
        self, payment_id: uuid.UUID, data: AdminPaymentUpdate
    ) -> AdminPaymentDetail:
        payment = await self.repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' was not found.",
            )
        updated = await self.repo.update(payment, data)
        return self._to_detail_schema(updated)
