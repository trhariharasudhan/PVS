import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.customer import Customer, CustomerType
from app.models.order import Order
from app.schemas.admin.customer import AdminCustomerCreate


class AdminCustomerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        customer_type: Optional[str] = None,
    ) -> Tuple[List[Tuple[Customer, int]], int]:
        """Query customers with total orders count."""
        # Subquery for orders count
        orders_subq = (
            select(Order.customer_id, func.count(Order.id).label("total_orders"))
            .group_by(Order.customer_id)
            .subquery()
        )

        base_query = (
            select(
                Customer,
                func.coalesce(orders_subq.c.total_orders, 0).label("orders_count"),
            )
            .outerjoin(orders_subq, orders_subq.c.customer_id == Customer.id)
        )

        if customer_type:
            try:
                ctype_enum = CustomerType(customer_type.upper().strip())
                base_query = base_query.where(Customer.customer_type == ctype_enum)
            except ValueError:
                pass

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Customer.full_name.ilike(term),
                    Customer.company_name.ilike(term),
                    Customer.phone.ilike(term),
                    Customer.email.ilike(term),
                    Customer.city.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Customer.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return list(result.all()), total

    async def get_by_id(self, customer_id: uuid.UUID) -> Optional[Customer]:
        """Fetch customer by ID."""
        query = select(Customer).where(Customer.id == customer_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[Customer]:
        """Fetch customer by phone."""
        query = select(Customer).where(Customer.phone == phone.strip())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: AdminCustomerCreate) -> Customer:
        """Create new customer record."""
        customer = Customer(
            id=uuid.uuid4(),
            full_name=data.full_name.strip(),
            company_name=data.company_name.strip() if data.company_name else None,
            customer_type=data.customer_type,
            phone=data.phone.strip(),
            whatsapp_number=data.whatsapp_number.strip() if data.whatsapp_number else None,
            email=data.email.strip().lower() if data.email else None,
            gstin=data.gstin.strip().upper() if data.gstin else None,
            city=data.city.strip(),
            state=data.state.strip(),
            shipping_address=data.shipping_address.strip() if data.shipping_address else None,
        )
        self.session.add(customer)
        await self.session.commit()
        await self.session.refresh(customer)
        return customer
