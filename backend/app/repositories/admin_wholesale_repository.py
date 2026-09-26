import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus
from app.models.user import User
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderItem, OrderType, PaymentStatus
from app.models.product import Product
from app.repositories.admin_order_repository import AdminOrderRepository
from app.schemas.admin.wholesale import AdminWholesaleEnquiryUpdate


class AdminWholesaleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.order_repo = AdminOrderRepository(session)

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Tuple[WholesaleEnquiry, Optional[str]]], int]:
        """Query wholesale enquiries with assigned user full name."""
        base_query = (
            select(
                WholesaleEnquiry,
                User.full_name.label("assigned_name"),
            )
            .outerjoin(User, User.id == WholesaleEnquiry.assigned_to_user_id)
        )

        if status:
            try:
                s_enum = EnquiryStatus(status.upper().strip())
                base_query = base_query.where(WholesaleEnquiry.status == s_enum)
            except ValueError:
                pass

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    WholesaleEnquiry.business_name.ilike(term),
                    WholesaleEnquiry.contact_person.ilike(term),
                    WholesaleEnquiry.phone.ilike(term),
                    WholesaleEnquiry.email.ilike(term),
                    WholesaleEnquiry.city.ilike(term),
                    WholesaleEnquiry.interested_collection.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(WholesaleEnquiry.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return list(result.all()), total

    async def get_by_id(self, enquiry_id: uuid.UUID) -> Optional[Tuple[WholesaleEnquiry, Optional[str]]]:
        """Fetch wholesale enquiry with assigned staff name."""
        query = (
            select(
                WholesaleEnquiry,
                User.full_name.label("assigned_name"),
            )
            .outerjoin(User, User.id == WholesaleEnquiry.assigned_to_user_id)
            .where(WholesaleEnquiry.id == enquiry_id)
        )
        result = await self.session.execute(query)
        return result.first()

    async def update(
        self, enquiry: WholesaleEnquiry, data: AdminWholesaleEnquiryUpdate
    ) -> WholesaleEnquiry:
        update_dict = data.model_dump(exclude_unset=True)

        if "status" in update_dict and update_dict["status"]:
            enquiry.status = update_dict["status"]
        if "assigned_to_user_id" in update_dict:
            enquiry.assigned_to_user_id = update_dict["assigned_to_user_id"]
        if "message" in update_dict:
            enquiry.message = update_dict["message"].strip() if update_dict["message"] else None

        await self.session.commit()
        await self.session.refresh(enquiry)
        return enquiry

    async def convert_to_order(
        self,
        enquiry: WholesaleEnquiry,
        items_payload: List[dict],
        order_type: OrderType = OrderType.WHOLESALE_BULK,
        notes: Optional[str] = None,
    ) -> Order:
        """
        Atomically convert wholesale enquiry into Customer + Order with inventory reservations.
        Idempotent: if already converted, returns existing order.
        """
        # 1. Find or create Customer
        cust_q = select(Customer).where(Customer.phone == enquiry.phone.strip())
        cust_res = await self.session.execute(cust_q)
        customer = cust_res.scalars().first()

        if not customer:
            customer = Customer(
                id=uuid.uuid4(),
                full_name=enquiry.contact_person.strip(),
                company_name=enquiry.business_name.strip(),
                customer_type=CustomerType.WHOLESALE_MERCHANT,
                phone=enquiry.phone.strip(),
                email=enquiry.email.strip().lower() if enquiry.email else None,
                city=enquiry.city.strip(),
                state="Tamil Nadu",
            )
            self.session.add(customer)
            await self.session.flush()

        # 2. Check if order already created for this enquiry
        ref_notes = f"Converted from Wholesale Enquiry #{str(enquiry.id)[:8]}"
        existing_order_q = (
            select(Order)
            .where(
                Order.customer_id == customer.id,
                Order.notes.ilike(f"%{ref_notes}%"),
            )
            .options(
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            )
        )
        existing_order = (await self.session.execute(existing_order_q)).scalars().first()
        if existing_order:
            enquiry.status = EnquiryStatus.CONVERTED_TO_ORDER
            await self.session.commit()
            return existing_order

        # 3. Create Order with reservation
        combined_notes = f"{ref_notes}. {notes or ''}".strip()
        order = await self.order_repo.create_order_with_reservation(
            customer_id=customer.id,
            order_type=order_type,
            payment_status=PaymentStatus.PENDING,
            items_payload=items_payload,
            notes=combined_notes,
        )

        # 4. Mark Enquiry as CONVERTED_TO_ORDER
        enquiry.status = EnquiryStatus.CONVERTED_TO_ORDER
        await self.session.commit()

        return order
