import uuid
from decimal import Decimal
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.raw_material import (
    RawMaterial,
    RawMaterialStock,
    RawMaterialMovement,
    MaterialType,
    UnitOfMeasure,
    RawMaterialMovementType,
)
from app.models.supplier import Supplier
from app.schemas.admin.raw_material import AdminRawMaterialCreate, AdminRawMaterialUpdate


class AdminRawMaterialRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_code(self, material_code: str) -> Optional[RawMaterial]:
        query = select(RawMaterial).where(RawMaterial.material_code == material_code.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        material_type: Optional[str] = None,
        low_stock_only: bool = False,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[RawMaterial], int]:
        """Query raw materials with joined stock and supplier data."""
        base_query = (
            select(RawMaterial)
            .join(RawMaterial.stock)
            .options(
                selectinload(RawMaterial.stock),
                selectinload(RawMaterial.supplier),
            )
        )

        if is_active is not None:
            base_query = base_query.where(RawMaterial.is_active.is_(is_active))

        if material_type:
            try:
                mtype_enum = MaterialType(material_type.upper().strip())
                base_query = base_query.where(RawMaterial.material_type == mtype_enum)
            except ValueError:
                pass

        if low_stock_only:
            base_query = base_query.where(
                RawMaterialStock.quantity_on_hand <= RawMaterial.reorder_level
            )

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    RawMaterial.material_code.ilike(term),
                    RawMaterial.name.ilike(term),
                    RawMaterial.description.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(RawMaterial.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        materials = list(result.scalars().all())
        return materials, total

    async def get_by_id(self, material_id: uuid.UUID) -> Optional[RawMaterial]:
        """Fetch raw material with stock, supplier, and recent 10 movements."""
        query = (
            select(RawMaterial)
            .where(RawMaterial.id == material_id)
            .options(
                selectinload(RawMaterial.stock),
                selectinload(RawMaterial.supplier),
                selectinload(RawMaterial.movements.and_(
                    RawMaterialMovement.raw_material_id == material_id
                )).selectinload(RawMaterialMovement.performed_by_user),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: AdminRawMaterialCreate, user_id: Optional[uuid.UUID] = None) -> RawMaterial:
        existing = await self.get_by_code(data.material_code)
        if existing:
            raise ValueError(f"Raw material with code '{data.material_code}' already exists.")

        mat_id = uuid.uuid4()
        material = RawMaterial(
            id=mat_id,
            material_code=data.material_code.strip().upper(),
            name=data.name.strip(),
            material_type=data.material_type,
            unit_of_measure=data.unit_of_measure,
            reorder_level=data.reorder_level,
            unit_cost=data.unit_cost,
            description=data.description.strip() if data.description else None,
            supplier_id=data.supplier_id,
            is_active=data.is_active,
        )

        stock = RawMaterialStock(
            id=uuid.uuid4(),
            raw_material_id=mat_id,
            quantity_on_hand=data.initial_stock,
            quantity_reserved=Decimal("0.00"),
            warehouse_location=data.warehouse_location.strip() if data.warehouse_location else None,
            last_restocked_at=datetime.now(timezone.utc) if data.initial_stock > 0 else None,
        )

        self.session.add(material)
        self.session.add(stock)

        if data.initial_stock > 0:
            movement = RawMaterialMovement(
                id=uuid.uuid4(),
                raw_material_id=mat_id,
                movement_type=RawMaterialMovementType.PURCHASE_RECEIPT,
                quantity_delta=data.initial_stock,
                reference_id="INITIAL_STOCK",
                performed_by_user_id=user_id,
                notes="Initial warehouse inventory baseline",
            )
            self.session.add(movement)

        await self.session.commit()
        return await self.get_by_id(mat_id)

    async def update(self, material: RawMaterial, data: AdminRawMaterialUpdate) -> RawMaterial:
        update_dict = data.model_dump(exclude_unset=True)

        if "name" in update_dict and update_dict["name"]:
            material.name = update_dict["name"].strip()
        if "material_type" in update_dict and update_dict["material_type"]:
            material.material_type = update_dict["material_type"]
        if "unit_of_measure" in update_dict and update_dict["unit_of_measure"]:
            material.unit_of_measure = update_dict["unit_of_measure"]
        if "reorder_level" in update_dict and update_dict["reorder_level"] is not None:
            material.reorder_level = update_dict["reorder_level"]
        if "unit_cost" in update_dict:
            material.unit_cost = update_dict["unit_cost"]
        if "description" in update_dict:
            material.description = update_dict["description"].strip() if update_dict["description"] else None
        if "supplier_id" in update_dict:
            material.supplier_id = update_dict["supplier_id"]
        if "is_active" in update_dict:
            material.is_active = update_dict["is_active"]

        if "warehouse_location" in update_dict and material.stock:
            material.stock.warehouse_location = update_dict["warehouse_location"].strip() if update_dict["warehouse_location"] else None

        await self.session.commit()
        return await self.get_by_id(material.id)

    async def adjust_stock(
        self,
        material_id: uuid.UUID,
        movement_type: RawMaterialMovementType,
        quantity_delta: Decimal,
        reference_id: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
        warehouse_location: Optional[str] = None,
    ) -> RawMaterial:
        """
        Adjust raw material stock with row-level locking and append-only audit trail.
        Enforces non-negative stock invariant.
        """
        stock_q = (
            select(RawMaterialStock)
            .where(RawMaterialStock.raw_material_id == material_id)
            .with_for_update(of=RawMaterialStock)
        )
        result = await self.session.execute(stock_q)
        stock = result.scalars().first()

        if not stock:
            raise ValueError(f"Stock record for raw material '{material_id}' not found.")

        new_on_hand = stock.quantity_on_hand + quantity_delta
        if new_on_hand < 0:
            raise ValueError(
                f"Adjustment of {quantity_delta} would cause negative stock. "
                f"Current on-hand: {stock.quantity_on_hand}."
            )

        stock.quantity_on_hand = new_on_hand
        stock.updated_at = datetime.now(timezone.utc)
        if quantity_delta > 0:
            stock.last_restocked_at = datetime.now(timezone.utc)
        if warehouse_location:
            stock.warehouse_location = warehouse_location.strip()

        movement = RawMaterialMovement(
            id=uuid.uuid4(),
            raw_material_id=material_id,
            movement_type=movement_type,
            quantity_delta=quantity_delta,
            reference_id=reference_id.strip() if reference_id else None,
            performed_by_user_id=user_id,
            notes=notes.strip() if notes else None,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(movement)

        await self.session.commit()
        return await self.get_by_id(material_id)
