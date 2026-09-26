import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_order_repository import AdminOrderRepository
from app.repositories.admin_customer_repository import AdminCustomerRepository
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.common import PaginatedResponse
from app.schemas.admin.customer import AdminCustomerDetail
from app.schemas.admin.order import (
    AdminOrderItemDetail,
    AdminOrderList,
    AdminOrderDetail,
    AdminOrderCreate,
    AdminOrderUpdate,
)


class AdminOrderService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminOrderRepository(session)
        self.cust_repo = AdminCustomerRepository(session)

    def _to_list_schema(self, order: Order) -> AdminOrderList:
        item_count = sum(item.quantity for item in order.items) if order.items else 0
        return AdminOrderList(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else "Unknown Customer",
            customer_company=order.customer.company_name if order.customer else None,
            customer_type=order.customer.customer_type if order.customer else None,
            customer_phone=order.customer.phone if order.customer else "-",
            order_type=order.order_type,
            order_status=order.order_status,
            payment_status=order.payment_status,
            subtotal_amount=order.subtotal_amount,
            tax_amount=order.tax_amount,
            shipping_amount=order.shipping_amount,
            total_amount=order.total_amount,
            item_count=item_count,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    def _to_detail_schema(self, order: Order) -> AdminOrderDetail:
        items_detail = []
        if order.items:
            for item in order.items:
                primary_url = None
                if item.product and item.product.images:
                    prim = next((img for img in item.product.images if img.is_primary), item.product.images[0])
                    primary_url = prim.image_url

                items_detail.append(
                    AdminOrderItemDetail(
                        id=item.id,
                        product_id=item.product_id,
                        product_code=item.product.code if item.product else "UNKNOWN",
                        product_name=item.product.name if item.product else "Unknown Saree",
                        category_name=item.product.category.name if item.product and item.product.category else "General",
                        primary_image_url=primary_url,
                        unit_price=item.unit_price,
                        quantity=item.quantity,
                        custom_colorway_notes=item.custom_colorway_notes,
                        line_total=item.line_total,
                    )
                )

        return AdminOrderDetail(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            customer=AdminCustomerDetail.model_validate(order.customer),
            order_type=order.order_type,
            order_status=order.order_status,
            payment_status=order.payment_status,
            subtotal_amount=order.subtotal_amount,
            tax_amount=order.tax_amount,
            shipping_amount=order.shipping_amount,
            total_amount=order.total_amount,
            tracking_number=order.tracking_number,
            notes=order.notes,
            items=items_detail,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    async def list_orders(
        self,
        page: int = 1,
        limit: int = 15,
        status_filter: Optional[str] = None,
        order_type: Optional[str] = None,
        payment_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminOrderList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        orders, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            status=status_filter,
            order_type=order_type,
            payment_status=payment_status,
            search=search,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(o) for o in orders]

        return PaginatedResponse[AdminOrderList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_order(self, order_id: uuid.UUID) -> AdminOrderDetail:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' was not found.",
            )
        return self._to_detail_schema(order)

    async def create_order(self, data: AdminOrderCreate) -> AdminOrderDetail:
        customer_id = data.customer_id

        # Auto-create inline customer if provided
        if not customer_id:
            if not data.new_customer:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Either 'customer_id' or 'new_customer' details must be provided.",
                )
            cust = await self.cust_repo.create(data.new_customer)
            customer_id = cust.id
        else:
            cust = await self.cust_repo.get_by_id(customer_id)
            if not cust:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Customer with ID '{customer_id}' was not found.",
                )

        items_payload = [item.model_dump() for item in data.items]

        try:
            order = await self.repo.create_order_with_reservation(
                customer_id=customer_id,
                order_type=data.order_type,
                payment_status=data.payment_status,
                items_payload=items_payload,
                tax_amount=data.tax_amount,
                shipping_amount=data.shipping_amount,
                notes=data.notes,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )

        return self._to_detail_schema(order)

    async def confirm_order(self, order_id: uuid.UUID) -> AdminOrderDetail:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' was not found.",
            )
        try:
            confirmed = await self.repo.confirm_order(order)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(confirmed)

    async def cancel_order(self, order_id: uuid.UUID) -> AdminOrderDetail:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' was not found.",
            )
        try:
            cancelled = await self.repo.cancel_order_release_reservation(order)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(cancelled)

    async def fulfill_order(
        self, order_id: uuid.UUID, user_id: Optional[uuid.UUID] = None
    ) -> AdminOrderDetail:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' was not found.",
            )
        try:
            fulfilled = await self.repo.fulfill_order_sale(order, user_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        return self._to_detail_schema(fulfilled)

    async def update_order(
        self, order_id: uuid.UUID, data: AdminOrderUpdate, user_id: Optional[uuid.UUID] = None
    ) -> AdminOrderDetail:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' was not found.",
            )

        if data.order_status == OrderStatus.CANCELLED and order.order_status != OrderStatus.CANCELLED:
            return await self.cancel_order(order_id)

        if data.order_status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] and order.order_status not in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
            return await self.fulfill_order(order_id, user_id)

        update_dict = data.model_dump(exclude_unset=True)
        if "order_status" in update_dict:
            order.order_status = update_dict["order_status"]
        if "payment_status" in update_dict:
            order.payment_status = update_dict["payment_status"]
        if "tracking_number" in update_dict:
            order.tracking_number = update_dict["tracking_number"]
        if "notes" in update_dict:
            order.notes = update_dict["notes"]

        await self.repo.session.commit()
        updated = await self.repo.get_by_id(order_id)
        return self._to_detail_schema(updated)
