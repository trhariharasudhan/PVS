import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_production_service import AdminProductionService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.production import (
    AdminProductionStage,
    AdminProductionBatchList,
    AdminProductionBatchDetail,
    AdminProductionBatchCreate,
    AdminProductionBatchUpdate,
    AdminProductionStageUpdate,
)
from app.schemas.admin.production_material import (
    AdminProductionBatchMaterialDetail,
    AdminProductionConsumeMaterialPayload,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminProductionBatchList],
    summary="Admin List Production Batches",
    description="List active and completed loom weaving batches with stage progression percentages.",
)
async def list_batches(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    status: Optional[str] = Query(None),
    product_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminProductionBatchList]:
    service = AdminProductionService(db)
    return await service.list_batches(
        page=page,
        limit=limit,
        status_filter=status,
        product_id=product_id,
        search=search,
    )


@router.post(
    "",
    response_model=AdminProductionBatchDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule Weaving Batch",
    description="Provision a new silk saree production run on a master loom with quality checkpoints.",
)
async def create_batch(
    payload: AdminProductionBatchCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductionBatchDetail:
    service = AdminProductionService(db)
    return await service.create_batch(payload)


@router.get(
    "/{batch_id}",
    response_model=AdminProductionBatchDetail,
    summary="Get Production Batch Detail",
    description="Retrieve batch status, loom identifier, planned quantities, and timeline checkpoints.",
)
async def get_batch(
    batch_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductionBatchDetail:
    service = AdminProductionService(db)
    return await service.get_batch(batch_id)


@router.patch(
    "/{batch_id}",
    response_model=AdminProductionBatchDetail,
    summary="Update Production Batch Status",
    description="Update batch status or mark COMPLETED to automatically credit inventory stock.",
)
async def update_batch(
    batch_id: uuid.UUID,
    payload: AdminProductionBatchUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductionBatchDetail:
    service = AdminProductionService(db)
    return await service.update_batch(
        batch_id=batch_id,
        data=payload,
        user_id=current_user.id,
    )


@router.get(
    "/{batch_id}/stages",
    response_model=List[AdminProductionStage],
    summary="List Production Stages for Batch",
    description="Retrieve all quality inspection checkpoints and current status for a batch.",
)
async def get_stages(
    batch_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> List[AdminProductionStage]:
    service = AdminProductionService(db)
    batch = await service.get_batch(batch_id)
    return batch.stages


@router.patch(
    "/{batch_id}/stages/{stage_id}",
    response_model=AdminProductionStage,
    summary="Update Quality Checkpoint Stage Status",
    description="Advance a quality inspection checkpoint (e.g. PASSED_QC, IN_PROGRESS).",
)
async def update_stage(
    batch_id: uuid.UUID,
    stage_id: uuid.UUID,
    payload: AdminProductionStageUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductionStage:
    service = AdminProductionService(db)
    return await service.update_stage(
        batch_id=batch_id,
        stage_id=stage_id,
        data=payload,
    )


@router.post(
    "/{batch_id}/consume-material",
    response_model=AdminProductionBatchMaterialDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Consume Raw Material for Batch",
    description="Atomically deduct raw material inventory and record PRODUCTION_CONSUMPTION ledger entry.",
)
async def consume_batch_material(
    batch_id: uuid.UUID,
    payload: AdminProductionConsumeMaterialPayload,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminProductionBatchMaterialDetail:
    from app.repositories.admin_production_material_repository import AdminProductionMaterialRepository
    from fastapi import HTTPException

    repo = AdminProductionMaterialRepository(db)
    try:
        consumed = await repo.consume_material(
            batch_id=batch_id,
            raw_material_id=payload.raw_material_id,
            quantity_consumed=payload.quantity_consumed,
            user_id=current_user.id,
            notes=payload.notes,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    return AdminProductionBatchMaterialDetail(
        id=consumed.id,
        batch_id=consumed.batch_id,
        raw_material_id=consumed.raw_material_id,
        material_code=consumed.raw_material.material_code,
        material_name=consumed.raw_material.name,
        unit_of_measure=consumed.raw_material.unit_of_measure.value,
        quantity_consumed=consumed.quantity_consumed,
        notes=consumed.notes,
        performed_by_name=consumed.performed_by_user.full_name if consumed.performed_by_user else None,
        created_at=consumed.created_at,
    )


@router.get(
    "/{batch_id}/materials",
    response_model=List[AdminProductionBatchMaterialDetail],
    summary="List Consumed Materials for Batch",
    description="Retrieve all raw materials consumed in the weaving process for a batch.",
)
async def get_batch_materials(
    batch_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> List[AdminProductionBatchMaterialDetail]:
    from app.repositories.admin_production_material_repository import AdminProductionMaterialRepository

    repo = AdminProductionMaterialRepository(db)
    items = await repo.get_batch_materials(batch_id)
    return [
        AdminProductionBatchMaterialDetail(
            id=c.id,
            batch_id=c.batch_id,
            raw_material_id=c.raw_material_id,
            material_code=c.raw_material.material_code,
            material_name=c.raw_material.name,
            unit_of_measure=c.raw_material.unit_of_measure.value,
            quantity_consumed=c.quantity_consumed,
            notes=c.notes,
            performed_by_name=c.performed_by_user.full_name if c.performed_by_user else None,
            created_at=c.created_at,
        )
        for c in items
    ]

