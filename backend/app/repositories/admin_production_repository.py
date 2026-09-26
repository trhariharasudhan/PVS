import uuid
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.production import ProductionBatch, ProductionStage, BatchStatus, StageStatus
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import InventoryMovement, MovementType
from app.schemas.admin.production import (
    AdminProductionBatchCreate,
    AdminProductionBatchUpdate,
    AdminProductionStageUpdate,
)


class AdminProductionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        status: Optional[str] = None,
        product_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[ProductionBatch], int]:
        """Query production batches with eager loaded product, category, and stages."""
        base_query = (
            select(ProductionBatch)
            .join(ProductionBatch.product)
            .join(Product.category)
            .options(
                selectinload(ProductionBatch.product).selectinload(Product.category),
                selectinload(ProductionBatch.stages),
            )
        )

        if product_id:
            base_query = base_query.where(ProductionBatch.product_id == product_id)

        if status:
            try:
                status_enum = BatchStatus(status.upper().strip())
                base_query = base_query.where(ProductionBatch.status == status_enum)
            except ValueError:
                pass

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    ProductionBatch.batch_number.ilike(term),
                    ProductionBatch.loom_identifier.ilike(term),
                    Product.name.ilike(term),
                    Product.code.ilike(term),
                )
            )

        # Count total
        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        # Order by newest
        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(ProductionBatch.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        batches = list(result.scalars().all())
        return batches, total

    async def get_by_id(self, batch_id: uuid.UUID) -> Optional[ProductionBatch]:
        """Fetch production batch with product, category, and all stages."""
        query = (
            select(ProductionBatch)
            .where(ProductionBatch.id == batch_id)
            .options(
                selectinload(ProductionBatch.product).selectinload(Product.category),
                selectinload(ProductionBatch.stages),
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_number(self, batch_number: str) -> Optional[ProductionBatch]:
        """Lookup by batch number."""
        query = select(ProductionBatch).where(ProductionBatch.batch_number == batch_number.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def is_batch_credited_to_inventory(self, batch_number: str) -> bool:
        """Checks if an InventoryMovement already exists referencing this batch completion."""
        ref = f"BATCH-{batch_number.strip().upper()}"
        query = select(InventoryMovement.id).where(
            InventoryMovement.reference_id == ref,
            InventoryMovement.movement_type == MovementType.PRODUCTION,
        )
        res = await self.session.execute(query)
        return res.scalars().first() is not None

    async def create(self, data: AdminProductionBatchCreate) -> ProductionBatch:
        """Create new production batch and initialize configurable stages."""
        batch = ProductionBatch(
            id=uuid.uuid4(),
            batch_number=data.batch_number.strip().upper(),
            product_id=data.product_id,
            loom_identifier=data.loom_identifier.strip() if data.loom_identifier else None,
            planned_quantity=data.planned_quantity,
            completed_quantity=0,
            status=BatchStatus.PLANNED,
            start_date=data.start_date,
            estimated_completion_date=data.estimated_completion_date,
        )
        self.session.add(batch)
        await self.session.flush()

        # Add initial stages
        if data.stages and len(data.stages) > 0:
            for s in data.stages:
                stage = ProductionStage(
                    id=uuid.uuid4(),
                    batch_id=batch.id,
                    stage_sequence=s.stage_sequence,
                    stage_name=s.stage_name.strip(),
                    status=s.status,
                    notes=s.notes.strip() if s.notes else None,
                )
                self.session.add(stage)
        else:
            # Default extensible silk saree loom checkpoints
            default_stages = [
                (1, "Raw Mulberry Silk & Pure Zari Testing"),
                (2, "Jacquard Loom Card Punching & Setting"),
                (3, "Warp Preparation & Bobbin Sizing"),
                (4, "Master Loom Interlocking Weave (Korvai)"),
                (5, "Quality Control & Traditional Edge Finishing"),
            ]
            for seq, name in default_stages:
                stage = ProductionStage(
                    id=uuid.uuid4(),
                    batch_id=batch.id,
                    stage_sequence=seq,
                    stage_name=name,
                    status=StageStatus.PENDING,
                )
                self.session.add(stage)

        await self.session.commit()
        return await self.get_by_id(batch.id)

    async def update(self, batch: ProductionBatch, data: AdminProductionBatchUpdate) -> ProductionBatch:
        """Update batch status, dates, or quantities."""
        update_dict = data.model_dump(exclude_unset=True)

        if "loom_identifier" in update_dict:
            batch.loom_identifier = update_dict["loom_identifier"].strip() if update_dict["loom_identifier"] else None
        if "planned_quantity" in update_dict and update_dict["planned_quantity"]:
            batch.planned_quantity = update_dict["planned_quantity"]
        if "completed_quantity" in update_dict and update_dict["completed_quantity"] is not None:
            batch.completed_quantity = update_dict["completed_quantity"]
        if "status" in update_dict and update_dict["status"]:
            batch.status = update_dict["status"]
        if "start_date" in update_dict:
            batch.start_date = update_dict["start_date"]
        if "estimated_completion_date" in update_dict:
            batch.estimated_completion_date = update_dict["estimated_completion_date"]

        await self.session.commit()
        return await self.get_by_id(batch.id)

    async def get_stage_by_id(self, stage_id: uuid.UUID) -> Optional[ProductionStage]:
        """Fetch single production stage."""
        query = select(ProductionStage).where(ProductionStage.id == stage_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update_stage(self, stage: ProductionStage, data: AdminProductionStageUpdate) -> ProductionStage:
        """Update single stage status and inspector notes."""
        update_dict = data.model_dump(exclude_unset=True)

        if "status" in update_dict and update_dict["status"]:
            stage.status = update_dict["status"]
            if update_dict["status"] == StageStatus.PASSED_QC and not stage.completed_at:
                stage.completed_at = datetime.now(timezone.utc)
        if "inspected_by" in update_dict:
            stage.inspected_by = update_dict["inspected_by"].strip() if update_dict["inspected_by"] else None
        if "notes" in update_dict:
            stage.notes = update_dict["notes"].strip() if update_dict["notes"] else None
        if "completed_at" in update_dict:
            stage.completed_at = update_dict["completed_at"]

        await self.session.commit()
        await self.session.refresh(stage)
        return stage
