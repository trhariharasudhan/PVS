import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_wholesale_repository import AdminWholesaleRepository
from app.services.admin.admin_order_service import AdminOrderService
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus
from app.schemas.common import PaginatedResponse
from app.schemas.admin.order import AdminOrderDetail
from app.schemas.admin.wholesale import (
    AdminWholesaleEnquiryList,
    AdminWholesaleEnquiryDetail,
    AdminWholesaleEnquiryUpdate,
    AdminWholesaleConvertToOrderPayload,
)


class AdminWholesaleService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminWholesaleRepository(session)
        self.order_service = AdminOrderService(session)

    async def list_enquiries(
        self,
        page: int = 1,
        limit: int = 15,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminWholesaleEnquiryList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        rows, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            status=status_filter,
            search=search,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [
            AdminWholesaleEnquiryList(
                id=enq.id,
                business_name=enq.business_name,
                contact_person=enq.contact_person,
                phone=enq.phone,
                email=enq.email,
                city=enq.city,
                business_type=enq.business_type,
                number_of_stores=enq.number_of_stores,
                interested_collection=enq.interested_collection,
                expected_quantity=enq.expected_quantity,
                status=enq.status,
                assigned_to_user_id=enq.assigned_to_user_id,
                assigned_user_name=assigned_name,
                created_at=enq.created_at,
                updated_at=enq.updated_at,
            )
            for enq, assigned_name in rows
        ]

        return PaginatedResponse[AdminWholesaleEnquiryList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_enquiry(self, enquiry_id: uuid.UUID) -> AdminWholesaleEnquiryDetail:
        row = await self.repo.get_by_id(enquiry_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale enquiry with ID '{enquiry_id}' was not found.",
            )
        enq, assigned_name = row
        return AdminWholesaleEnquiryDetail(
            id=enq.id,
            business_name=enq.business_name,
            contact_person=enq.contact_person,
            phone=enq.phone,
            email=enq.email,
            city=enq.city,
            business_type=enq.business_type,
            number_of_stores=enq.number_of_stores,
            interested_collection=enq.interested_collection,
            expected_quantity=enq.expected_quantity,
            message=enq.message,
            status=enq.status,
            assigned_to_user_id=enq.assigned_to_user_id,
            assigned_user_name=assigned_name,
            created_at=enq.created_at,
            updated_at=enq.updated_at,
        )

    async def update_enquiry(
        self, enquiry_id: uuid.UUID, data: AdminWholesaleEnquiryUpdate
    ) -> AdminWholesaleEnquiryDetail:
        row = await self.repo.get_by_id(enquiry_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale enquiry with ID '{enquiry_id}' was not found.",
            )
        enq, _ = row
        updated = await self.repo.update(enq, data)
        return await self.get_enquiry(updated.id)

    async def convert_to_order(
        self, enquiry_id: uuid.UUID, data: AdminWholesaleConvertToOrderPayload
    ) -> AdminOrderDetail:
        row = await self.repo.get_by_id(enquiry_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wholesale enquiry with ID '{enquiry_id}' was not found.",
            )
        enq, _ = row

        items_payload = [item.model_dump() for item in data.items]

        try:
            order = await self.repo.convert_to_order(
                enquiry=enq,
                items_payload=items_payload,
                order_type=data.order_type,
                notes=data.notes,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )

        return self.order_service._to_detail_schema(order)
