import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.production import ProductionBatch, BatchStatus
from app.models.production_material import ProductionBatchMaterial
from app.models.raw_material import (
    RawMaterial,
    RawMaterialStock,
    RawMaterialMovement,
    RawMaterialMovementType,
)
from app.models.user import User


class AdminProductionMaterialRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_batch_materials(
        self, batch_id: uuid.UUID
    ) -> List[ProductionBatchMaterial]:
        query = (
            select(ProductionBatchMaterial)
            .where(ProductionBatchMaterial.batch_id == batch_id)
            .options(
                selectinload(ProductionBatchMaterial.raw_material),
                selectinload(ProductionBatchMaterial.performed_by_user),
            )
            .order_by(ProductionBatchMaterial.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def consume_material(
        self,
        batch_id: uuid.UUID,
        raw_material_id: uuid.UUID,
        quantity_consumed: Decimal,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
    ) -> ProductionBatchMaterial:
        """
        Atomically consume raw materials for a production batch with row-level locking.
        Deducts raw material stock and writes immutable PRODUCTION_CONSUMPTION ledger entry.
        """
        batch_q = select(ProductionBatch).where(ProductionBatch.id == batch_id)
        batch = (await self.session.execute(batch_q)).scalars().first()
        if not batch:
            raise ValueError(f"Production batch '{batch_id}' not found.")

        if batch.status in [BatchStatus.COMPLETED, BatchStatus.ABORTED]:
            raise ValueError(f"Cannot consume materials for a {batch.status.value} production batch.")

        mat_q = select(RawMaterial).where(RawMaterial.id == raw_material_id)
        mat = (await self.session.execute(mat_q)).scalars().first()
        if not mat:
            raise ValueError(f"Raw material '{raw_material_id}' not found.")
        if not mat.is_active:
            raise ValueError(f"Raw material '{mat.material_code}' is inactive.")

        # Row-lock RawMaterialStock
        stock_q = (
            select(RawMaterialStock)
            .where(RawMaterialStock.raw_material_id == raw_material_id)
            .with_for_update(of=RawMaterialStock)
        )
        stock = (await self.session.execute(stock_q)).scalars().first()
        if not stock:
            raise ValueError(f"Stock record for raw material '{mat.material_code}' not found.")

        if stock.quantity_available < quantity_consumed:
            raise ValueError(
                f"Insufficient raw material stock for '{mat.material_code}'. "
                f"On-Hand: {stock.quantity_on_hand}, Available: {stock.quantity_available}, "
                f"Requested Consumption: {quantity_consumed} {mat.unit_of_measure.value}."
            )

        # Decrement stock
        stock.quantity_on_hand -= quantity_consumed
        stock.updated_at = datetime.now(timezone.utc)

        # Create movement ledger
        movement = RawMaterialMovement(
            id=uuid.uuid4(),
            raw_material_id=raw_material_id,
            movement_type=RawMaterialMovementType.PRODUCTION_CONSUMPTION,
            quantity_delta=-quantity_consumed,
            reference_id=f"BATCH-{batch.batch_number}",
            performed_by_user_id=user_id,
            notes=f"Consumed for Batch {batch.batch_number} ({batch.planned_quantity} sarees). {notes or ''}".strip(),
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(movement)

        # Create batch material linkage
        consumption_id = uuid.uuid4()
        consumption = ProductionBatchMaterial(
            id=consumption_id,
            batch_id=batch_id,
            raw_material_id=raw_material_id,
            quantity_consumed=quantity_consumed,
            notes=notes.strip() if notes else None,
            performed_by_user_id=user_id,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(consumption)

        await self.session.commit()

        # Reload with relations
        query = (
            select(ProductionBatchMaterial)
            .where(ProductionBatchMaterial.id == consumption_id)
            .options(
                selectinload(ProductionBatchMaterial.raw_material),
                selectinload(ProductionBatchMaterial.performed_by_user),
            )
        )
        return (await self.session.execute(query)).scalars().first()
