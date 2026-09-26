import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_customer_repository import AdminCustomerRepository
from app.models.customer import Customer
from app.schemas.common import PaginatedResponse
from app.schemas.admin.customer import (
    AdminCustomerList,
    AdminCustomerDetail,
    AdminCustomerCreate,
)


class AdminCustomerService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminCustomerRepository(session)

    async def list_customers(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        customer_type: Optional[str] = None,
    ) -> PaginatedResponse[AdminCustomerList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        rows, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            search=search,
            customer_type=customer_type,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [
            AdminCustomerList(
                id=c.id,
                full_name=c.full_name,
                company_name=c.company_name,
                customer_type=c.customer_type,
                phone=c.phone,
                whatsapp_number=c.whatsapp_number,
                email=c.email,
                city=c.city,
                state=c.state,
                total_orders_count=orders_count,
                created_at=c.created_at,
            )
            for c, orders_count in rows
        ]

        return PaginatedResponse[AdminCustomerList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_customer(self, customer_id: uuid.UUID) -> AdminCustomerDetail:
        cust = await self.repo.get_by_id(customer_id)
        if not cust:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID '{customer_id}' was not found.",
            )
        return AdminCustomerDetail.model_validate(cust)

    async def create_customer(self, data: AdminCustomerCreate) -> AdminCustomerDetail:
        cust = await self.repo.create(data)
        return AdminCustomerDetail.model_validate(cust)
