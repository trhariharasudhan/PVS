import uuid
import random
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.payment import (
    Payment,
    PaymentType,
    PaymentMethod,
    PaymentRecordStatus,
)
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.order import Order
from app.models.purchase import PurchaseOrder
from app.schemas.admin.payment import AdminPaymentCreate, AdminPaymentUpdate


class AdminPaymentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_unique_payment_number(self) -> str:
        for _ in range(20):
            num = random.randint(10000, 99999)
            code = f"PVS-PAY-{num}"
            existing = await self.get_by_number(code)
            if not existing:
                return code
        return f"PVS-PAY-{int(datetime.now().timestamp()) % 1000000}"

    async def get_by_number(self, payment_number: str) -> Optional[Payment]:
        query = select(Payment).where(Payment.payment_number == payment_number.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_paginated(
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
    ) -> Tuple[List[Payment], int]:
        base_query = (
            select(Payment)
            .options(
                selectinload(Payment.customer),
                selectinload(Payment.supplier),
                selectinload(Payment.order),
                selectinload(Payment.purchase_order),
                selectinload(Payment.recorded_by_user),
            )
        )

        if payment_type:
            try:
                t_enum = PaymentType(payment_type.upper().strip())
                base_query = base_query.where(Payment.payment_type == t_enum)
            except ValueError:
                pass

        if payment_status:
            try:
                s_enum = PaymentRecordStatus(payment_status.upper().strip())
                base_query = base_query.where(Payment.payment_status == s_enum)
            except ValueError:
                pass

        if customer_id:
            base_query = base_query.where(Payment.customer_id == customer_id)
        if supplier_id:
            base_query = base_query.where(Payment.supplier_id == supplier_id)
        if order_id:
            base_query = base_query.where(Payment.order_id == order_id)
        if purchase_order_id:
            base_query = base_query.where(Payment.purchase_order_id == purchase_order_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.outerjoin(Customer, Customer.id == Payment.customer_id).outerjoin(
                Supplier, Supplier.id == Payment.supplier_id
            ).where(
                or_(
                    Payment.payment_number.ilike(term),
                    Payment.reference_transaction_id.ilike(term),
                    Customer.full_name.ilike(term),
                    Customer.company_name.ilike(term),
                    Supplier.supplier_name.ilike(term),
                    Supplier.supplier_code.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        payments = list(result.scalars().all())
        return payments, total

    async def get_by_id(self, payment_id: uuid.UUID) -> Optional[Payment]:
        query = (
            select(Payment)
            .where(Payment.id == payment_id)
            .options(
                selectinload(Payment.customer),
                selectinload(Payment.supplier),
                selectinload(Payment.order),
                selectinload(Payment.purchase_order),
                selectinload(Payment.recorded_by_user),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(
        self, data: AdminPaymentCreate, user_id: Optional[uuid.UUID] = None
    ) -> Payment:
        payment_number = await self.generate_unique_payment_number()
        payment_id = uuid.uuid4()

        payment = Payment(
            id=payment_id,
            payment_number=payment_number,
            payment_type=data.payment_type,
            customer_id=data.customer_id,
            supplier_id=data.supplier_id,
            order_id=data.order_id,
            purchase_order_id=data.purchase_order_id,
            amount=data.amount,
            payment_method=data.payment_method,
            payment_status=data.payment_status,
            reference_transaction_id=data.reference_transaction_id.strip() if data.reference_transaction_id else None,
            payment_date=data.payment_date,
            notes=data.notes.strip() if data.notes else None,
            recorded_by_user_id=user_id,
        )
        self.session.add(payment)
        await self.session.commit()
        return await self.get_by_id(payment_id)

    async def update(
        self, payment: Payment, data: AdminPaymentUpdate
    ) -> Payment:
        update_dict = data.model_dump(exclude_unset=True)

        if "payment_status" in update_dict and update_dict["payment_status"]:
            payment.payment_status = update_dict["payment_status"]
        if "reference_transaction_id" in update_dict:
            payment.reference_transaction_id = update_dict["reference_transaction_id"].strip() if update_dict["reference_transaction_id"] else None
        if "notes" in update_dict:
            payment.notes = update_dict["notes"].strip() if update_dict["notes"] else None

        await self.session.commit()
        return await self.get_by_id(payment.id)
