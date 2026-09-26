import uuid
import math
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_production_repository import AdminProductionRepository
from app.repositories.admin_inventory_repository import AdminInventoryRepository
from app.repositories.admin_product_repository import AdminProductRepository
from app.models.production import ProductionBatch, ProductionStage, BatchStatus, StageStatus
from app.models.inventory import MovementType
from app.schemas.common import PaginatedResponse
from app.schemas.admin.production import (
    AdminProductionStage,
    AdminProductionBatchList,
    AdminProductionBatchDetail,
    AdminProductionBatchCreate,
    AdminProductionBatchUpdate,
    AdminProductionStageUpdate,
)


class AdminProductionService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminProductionRepository(session)
        self.inv_repo = AdminInventoryRepository(session)
        self.product_repo = AdminProductRepository(session)

    def _calc_progress(self, stages: List[ProductionStage]) -> int:
        if not stages:
            return 0
        passed_count = sum(1 for s in stages if s.status == StageStatus.PASSED_QC)
        return int((passed_count / len(stages)) * 100)

    def _get_current_stage_name(self, stages: List[ProductionStage]) -> Optional[str]:
        if not stages:
            return None
        in_prog = next((s for s in stages if s.status == StageStatus.IN_PROGRESS), None)
        if in_prog:
            return in_prog.stage_name
        pending = next((s for s in stages if s.status == StageStatus.PENDING), None)
        if pending:
            return pending.stage_name
        return stages[-1].stage_name

    def _to_list_schema(self, batch: ProductionBatch) -> AdminProductionBatchList:
        progress = self._calc_progress(batch.stages)
        current_stage = self._get_current_stage_name(batch.stages)

        return AdminProductionBatchList(
            id=batch.id,
            batch_number=batch.batch_number,
            product_id=batch.product_id,
            product_code=batch.product.code if batch.product else "UNKNOWN",
            product_name=batch.product.name if batch.product else "Unknown Model",
            category_name=batch.product.category.name if batch.product and batch.product.category else "General",
            loom_identifier=batch.loom_identifier,
            planned_quantity=batch.planned_quantity,
            completed_quantity=batch.completed_quantity,
            status=batch.status,
            progress_percent=progress,
            current_stage_name=current_stage,
            start_date=batch.start_date,
            estimated_completion_date=batch.estimated_completion_date,
            created_at=batch.created_at,
            updated_at=batch.updated_at,
        )

    def _to_detail_schema(self, batch: ProductionBatch) -> AdminProductionBatchDetail:
        progress = self._calc_progress(batch.stages)
        stage_schemas = [
            AdminProductionStage(
                id=s.id,
                batch_id=s.batch_id,
                stage_sequence=s.stage_sequence,
                stage_name=s.stage_name,
                status=s.status,
                inspected_by=s.inspected_by,
                notes=s.notes,
                completed_at=s.completed_at,
            )
            for s in sorted(batch.stages, key=lambda st: st.stage_sequence)
        ]

        return AdminProductionBatchDetail(
            id=batch.id,
            batch_number=batch.batch_number,
            product_id=batch.product_id,
            product_code=batch.product.code if batch.product else "UNKNOWN",
            product_name=batch.product.name if batch.product else "Unknown Model",
            category_name=batch.product.category.name if batch.product and batch.product.category else "General",
            loom_identifier=batch.loom_identifier,
            planned_quantity=batch.planned_quantity,
            completed_quantity=batch.completed_quantity,
            status=batch.status,
            progress_percent=progress,
            start_date=batch.start_date,
            estimated_completion_date=batch.estimated_completion_date,
            stages=stage_schemas,
            created_at=batch.created_at,
            updated_at=batch.updated_at,
        )

    async def list_batches(
        self,
        page: int = 1,
        limit: int = 15,
        status_filter: Optional[str] = None,
        product_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminProductionBatchList]:
        page = max(1, page)
        limit = max(1, min(100, limit))

        batches, total = await self.repo.get_paginated(
            page=page,
            limit=limit,
            status=status_filter,
            product_id=product_id,
            search=search,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        items = [self._to_list_schema(b) for b in batches]

        return PaginatedResponse[AdminProductionBatchList](
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_batch(self, batch_id: uuid.UUID) -> AdminProductionBatchDetail:
        batch = await self.repo.get_by_id(batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production batch with ID '{batch_id}' was not found.",
            )
        return self._to_detail_schema(batch)

    async def create_batch(self, data: AdminProductionBatchCreate) -> AdminProductionBatchDetail:
        existing = await self.repo.get_by_number(data.batch_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A production batch with number '{data.batch_number.upper()}' already exists.",
            )

        prod = await self.product_repo.get_by_id(data.product_id)
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{data.product_id}' was not found.",
            )

        created = await self.repo.create(data)
        return self._to_detail_schema(created)

    async def update_batch(
        self,
        batch_id: uuid.UUID,
        data: AdminProductionBatchUpdate,
        user_id: Optional[uuid.UUID] = None,
    ) -> AdminProductionBatchDetail:
        batch = await self.repo.get_by_id(batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production batch with ID '{batch_id}' was not found.",
            )

        # CRITICAL INTEGRATION: Production -> Inventory Transition
        if data.status == BatchStatus.COMPLETED and batch.status != BatchStatus.COMPLETED:
            already_credited = await self.repo.is_batch_credited_to_inventory(batch.batch_number)
            if not already_credited:
                credited_qty = (
                    data.completed_quantity
                    if data.completed_quantity is not None and data.completed_quantity > 0
                    else (batch.completed_quantity if batch.completed_quantity > 0 else batch.planned_quantity)
                )

                # Atomically adjust inventory with PRODUCTION movement ledger entry
                try:
                    await self.inv_repo.adjust_stock(
                        product_id=batch.product_id,
                        delta=credited_qty,
                        movement_type=MovementType.PRODUCTION,
                        user_id=user_id,
                        reference_id=f"BATCH-{batch.batch_number}",
                        notes=f"Production Batch {batch.batch_number} completed on loom {batch.loom_identifier or 'Loom 01'}.",
                    )
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Failed to credit production stock to inventory: {e}",
                    )

                data.completed_quantity = credited_qty

        updated = await self.repo.update(batch, data)
        return self._to_detail_schema(updated)

    async def update_stage(
        self,
        batch_id: uuid.UUID,
        stage_id: uuid.UUID,
        data: AdminProductionStageUpdate,
    ) -> AdminProductionStage:
        stage = await self.repo.get_stage_by_id(stage_id)
        if not stage or stage.batch_id != batch_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage with ID '{stage_id}' was not found for batch '{batch_id}'.",
            )

        updated_stage = await self.repo.update_stage(stage, data)
        return AdminProductionStage(
            id=updated_stage.id,
            batch_id=updated_stage.batch_id,
            stage_sequence=updated_stage.stage_sequence,
            stage_name=updated_stage.stage_name,
            status=updated_stage.status,
            inspected_by=updated_stage.inspected_by,
            notes=updated_stage.notes,
            completed_at=updated_stage.completed_at,
        )
