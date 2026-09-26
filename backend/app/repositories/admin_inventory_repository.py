import uuid
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.product import Product, AvailabilityStatus
from app.models.category import Category
from app.models.user import User


class AdminInventoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_inventory(self, product_id: uuid.UUID) -> Inventory:
        """Fetch or automatically initialize inventory record for product."""
        query = select(Inventory).where(Inventory.product_id == product_id)
        result = await self.session.execute(query)
        inv = result.scalars().first()
        if not inv:
            inv = Inventory(
                id=uuid.uuid4(),
                product_id=product_id,
                quantity_on_hand=0,
                quantity_reserved=0,
                reorder_threshold=5,
            )
            self.session.add(inv)
            await self.session.commit()
            await self.session.refresh(inv)
        return inv

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        stock_status: Optional[str] = None,
        low_stock_only: Optional[bool] = None,
    ) -> Tuple[List[Tuple[Inventory, Product, Optional[datetime]]], int]:
        """
        Query inventory joined with product and latest movement timestamp.
        """
        # Subquery for latest movement date
        latest_movement_subq = (
            select(
                InventoryMovement.inventory_id,
                func.max(InventoryMovement.created_at).label("last_movement_at"),
            )
            .group_by(InventoryMovement.inventory_id)
            .subquery()
        )

        base_query = (
            select(
                Inventory,
                Product,
                latest_movement_subq.c.last_movement_at,
            )
            .join(Product, Product.id == Inventory.product_id)
            .join(Product.category)
            .outerjoin(
                latest_movement_subq,
                latest_movement_subq.c.inventory_id == Inventory.id,
            )
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )

        if category_id:
            base_query = base_query.where(Product.category_id == category_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Product.name.ilike(term),
                    Product.code.ilike(term),
                    Product.fabric.ilike(term),
                    Inventory.warehouse_location.ilike(term),
                )
            )

        if low_stock_only:
            base_query = base_query.where(
                Inventory.quantity_on_hand > 0,
                Inventory.quantity_on_hand <= Inventory.reorder_threshold,
            )
        elif stock_status:
            status_upper = stock_status.upper().strip()
            if status_upper == "OUT_OF_STOCK":
                base_query = base_query.where(Inventory.quantity_on_hand == 0)
            elif status_upper == "LOW_STOCK":
                base_query = base_query.where(
                    Inventory.quantity_on_hand > 0,
                    Inventory.quantity_on_hand <= Inventory.reorder_threshold,
                )
            elif status_upper == "IN_STOCK":
                base_query = base_query.where(
                    Inventory.quantity_on_hand > Inventory.reorder_threshold
                )

        # Count total
        count_query = select(func.count()).select_from(base_query.subquery())
        total_res = await self.session.execute(count_query)
        total_count = total_res.scalar() or 0

        # Pagination and order
        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Product.is_active.desc(), Inventory.quantity_on_hand.asc(), Product.name.asc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        items = list(result.all())
        return items, total_count

    async def get_by_product_id(
        self, product_id: uuid.UUID, for_update: bool = False
    ) -> Optional[Tuple[Inventory, Product]]:
        """Retrieve inventory and product, optionally locking row with SELECT FOR UPDATE."""
        query = (
            select(Inventory, Product)
            .join(Product, Product.id == Inventory.product_id)
            .where(Inventory.product_id == product_id)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )
        if for_update:
            query = query.with_for_update(of=Inventory)

        result = await self.session.execute(query)
        row = result.first()
        if not row:
            # Check if product exists without inventory yet
            prod_q = (
                select(Product)
                .where(Product.id == product_id)
                .options(
                    selectinload(Product.category),
                    selectinload(Product.images),
                )
            )
            prod_res = await self.session.execute(prod_q)
            prod = prod_res.scalars().first()
            if not prod:
                return None
            # Initialize inventory
            inv = await self.get_or_create_inventory(product_id)
            return inv, prod

        return row[0], row[1]

    async def adjust_stock(
        self,
        product_id: uuid.UUID,
        delta: int,
        movement_type: MovementType,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
        reference_id: Optional[str] = None,
        warehouse_location: Optional[str] = None,
    ) -> Tuple[Inventory, InventoryMovement]:
        """
        Atomically adjust inventory with row locking and append to immutable movement ledger.
        Enforces quantity_on_hand >= 0.
        """
        if delta == 0:
            raise ValueError("Stock adjustment delta cannot be zero.")

        # 1. Fetch inventory row with FOR UPDATE lock
        row = await self.get_by_product_id(product_id, for_update=True)
        if not row:
            raise ValueError(f"Inventory record for product '{product_id}' was not found.")

        inv, prod = row

        new_quantity = inv.quantity_on_hand + delta
        if new_quantity < 0:
            raise ValueError(
                f"Insufficient stock for product '{prod.code}'. "
                f"Current stock: {inv.quantity_on_hand}, Requested delta: {delta}, Resulting stock: {new_quantity}."
            )

        # 2. Update Inventory
        inv.quantity_on_hand = new_quantity
        if warehouse_location:
            inv.warehouse_location = warehouse_location.strip()
        inv.updated_at = datetime.now(timezone.utc)

        # 3. Create Immutable Movement Ledger Entry
        movement = InventoryMovement(
            id=uuid.uuid4(),
            inventory_id=inv.id,
            movement_type=movement_type,
            quantity_delta=delta,
            reference_id=reference_id.strip() if reference_id else None,
            performed_by_user_id=user_id,
            notes=notes.strip() if notes else None,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(movement)

        # 4. Commit transaction atomically
        await self.session.commit()
        await self.session.refresh(inv)
        await self.session.refresh(movement)

        return inv, movement

    async def get_movements_by_product_id(
        self, product_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> Tuple[List[Tuple[InventoryMovement, Optional[str]]], int]:
        """
        Chronological audit ledger of movements for a product.
        Returns movement and user full name.
        """
        inv_q = select(Inventory.id).where(Inventory.product_id == product_id)
        inv_id = (await self.session.execute(inv_q)).scalar()
        if not inv_id:
            return [], 0

        base_query = (
            select(
                InventoryMovement,
                User.full_name.label("user_name"),
            )
            .outerjoin(User, User.id == InventoryMovement.performed_by_user_id)
            .where(InventoryMovement.inventory_id == inv_id)
        )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(InventoryMovement.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return list(result.all()), total
