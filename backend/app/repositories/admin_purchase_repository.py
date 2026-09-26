import uuid
import random
from decimal import Decimal
from typing import Optional, List, Tuple
from datetime import date, datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.supplier import Supplier
from app.models.raw_material import (
    RawMaterial,
    RawMaterialStock,
    RawMaterialMovement,
    RawMaterialMovementType,
)
from app.models.user import User


class AdminPurchaseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_unique_po_number(self) -> str:
        for _ in range(20):
            num = random.randint(10000, 99999)
            code = f"PVS-PO-{num}"
            existing = await self.get_by_number(code)
            if not existing:
                return code
        return f"PVS-PO-{int(datetime.now().timestamp()) % 1000000}"

    async def get_by_number(self, po_number: str) -> Optional[PurchaseOrder]:
        query = select(PurchaseOrder).where(PurchaseOrder.po_number == po_number.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        status: Optional[str] = None,
        supplier_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[PurchaseOrder], int]:
        base_query = (
            select(PurchaseOrder)
            .join(PurchaseOrder.supplier)
            .options(
                selectinload(PurchaseOrder.supplier),
                selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.raw_material),
                selectinload(PurchaseOrder.created_by_user),
            )
        )

        if status:
            try:
                s_enum = PurchaseOrderStatus(status.upper().strip())
                base_query = base_query.where(PurchaseOrder.status == s_enum)
            except ValueError:
                pass

        if supplier_id:
            base_query = base_query.where(PurchaseOrder.supplier_id == supplier_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    PurchaseOrder.po_number.ilike(term),
                    Supplier.supplier_name.ilike(term),
                    Supplier.supplier_code.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(PurchaseOrder.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        pos = list(result.scalars().all())
        return pos, total

    async def get_by_id(self, po_id: uuid.UUID) -> Optional[PurchaseOrder]:
        query = (
            select(PurchaseOrder)
            .where(PurchaseOrder.id == po_id)
            .options(
                selectinload(PurchaseOrder.supplier),
                selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.raw_material),
                selectinload(PurchaseOrder.created_by_user),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(
        self,
        supplier_id: uuid.UUID,
        order_date: date,
        expected_delivery_date: Optional[date],
        items_payload: List[dict],
        tax_amount: Decimal = Decimal("0.00"),
        notes: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
    ) -> PurchaseOrder:
        supplier_q = select(Supplier).where(Supplier.id == supplier_id)
        supplier = (await self.session.execute(supplier_q)).scalars().first()
        if not supplier:
            raise ValueError(f"Supplier '{supplier_id}' not found.")
        if not supplier.is_active:
            raise ValueError(f"Supplier '{supplier.supplier_code}' is deactivated.")

        po_number = await self.generate_unique_po_number()
        po_id = uuid.uuid4()

        subtotal = Decimal("0.00")
        po_items: List[PurchaseOrderItem] = []

        for item_data in items_payload:
            mat_id = item_data["raw_material_id"]
            qty = Decimal(str(item_data["quantity_ordered"]))
            unit_cost = Decimal(str(item_data["unit_cost"]))

            mat_q = select(RawMaterial).where(RawMaterial.id == mat_id)
            mat = (await self.session.execute(mat_q)).scalars().first()
            if not mat:
                raise ValueError(f"Raw material '{mat_id}' not found.")
            if not mat.is_active:
                raise ValueError(f"Raw material '{mat.material_code}' is inactive.")

            line_total = qty * unit_cost
            subtotal += line_total

            item = PurchaseOrderItem(
                id=uuid.uuid4(),
                purchase_order_id=po_id,
                raw_material_id=mat_id,
                quantity_ordered=qty,
                quantity_received=Decimal("0.00"),
                unit_cost=unit_cost,
                line_total=line_total,
            )
            po_items.append(item)

        total_amount = subtotal + tax_amount

        po = PurchaseOrder(
            id=po_id,
            po_number=po_number,
            supplier_id=supplier_id,
            status=PurchaseOrderStatus.DRAFT,
            order_date=order_date,
            expected_delivery_date=expected_delivery_date,
            subtotal_amount=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes=notes.strip() if notes else None,
            created_by_user_id=user_id,
        )

        self.session.add(po)
        for item in po_items:
            self.session.add(item)

        await self.session.commit()
        return await self.get_by_id(po_id)

    async def receive_items(
        self,
        po_id: uuid.UUID,
        receive_payloads: List[dict],
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
        warehouse_location: Optional[str] = None,
    ) -> PurchaseOrder:
        """
        Atomically receive raw materials from a purchase order into inventory,
        log immutable PURCHASE_RECEIPT ledger records, and update PO item receipts.
        """
        po = await self.get_by_id(po_id)
        if not po:
            raise ValueError(f"Purchase order '{po_id}' not found.")

        if po.status in [PurchaseOrderStatus.RECEIVED]:
            raise ValueError(f"Purchase order '{po.po_number}' is already fully received.")

        if po.status == PurchaseOrderStatus.CANCELLED:
            raise ValueError(f"Cannot receive items for a cancelled purchase order.")

        item_map = {item.id: item for item in po.items}

        for rcv in receive_payloads:
            item_id = rcv["item_id"]
            qty_to_rcv = Decimal(str(rcv["quantity_to_receive"]))

            if item_id not in item_map:
                raise ValueError(f"Item '{item_id}' not found in purchase order '{po.po_number}'.")

            item = item_map[item_id]
            remaining = item.quantity_ordered - item.quantity_received
            if qty_to_rcv > remaining:
                raise ValueError(
                    f"Cannot receive {qty_to_rcv} units of '{item.raw_material.material_code}'. "
                    f"Ordered: {item.quantity_ordered}, Already Received: {item.quantity_received}, Remaining: {remaining}."
                )

            # Lock RawMaterialStock row
            stock_q = (
                select(RawMaterialStock)
                .where(RawMaterialStock.raw_material_id == item.raw_material_id)
                .with_for_update(of=RawMaterialStock)
            )
            stock_res = await self.session.execute(stock_q)
            stock = stock_res.scalars().first()

            if not stock:
                stock = RawMaterialStock(
                    id=uuid.uuid4(),
                    raw_material_id=item.raw_material_id,
                    quantity_on_hand=Decimal("0.00"),
                    quantity_reserved=Decimal("0.00"),
                    warehouse_location=warehouse_location,
                )
                self.session.add(stock)
                await self.session.flush()

            # Increment stock
            stock.quantity_on_hand += qty_to_rcv
            stock.last_restocked_at = datetime.now(timezone.utc)
            stock.updated_at = datetime.now(timezone.utc)
            if warehouse_location:
                stock.warehouse_location = warehouse_location.strip()

            # Increment item received
            item.quantity_received += qty_to_rcv

            # Log movement
            movement = RawMaterialMovement(
                id=uuid.uuid4(),
                raw_material_id=item.raw_material_id,
                movement_type=RawMaterialMovementType.PURCHASE_RECEIPT,
                quantity_delta=qty_to_rcv,
                reference_id=f"PO-{po.po_number}",
                performed_by_user_id=user_id,
                notes=f"Received via PO {po.po_number}. {notes or ''}".strip(),
                created_at=datetime.now(timezone.utc),
            )
            self.session.add(movement)

        # Update overall PO status
        all_fully_received = all(
            it.quantity_received >= it.quantity_ordered for it in po.items
        )
        po.status = (
            PurchaseOrderStatus.RECEIVED
            if all_fully_received
            else PurchaseOrderStatus.PARTIALLY_RECEIVED
        )

        await self.session.commit()
        return await self.get_by_id(po_id)
