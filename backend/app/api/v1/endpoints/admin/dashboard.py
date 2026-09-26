from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_authenticated_user
from app.models.user import User
from app.services.admin.admin_dashboard_service import AdminDashboardService
from app.schemas.admin.dashboard import AdminDashboardMetrics

router = APIRouter()


@router.get(
    "",
    response_model=AdminDashboardMetrics,
    summary="Admin Business Dashboard Metrics",
    description="Retrieve live aggregated product inventory, category, and wholesale metrics.",
)
async def get_admin_dashboard(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardMetrics:
    service = AdminDashboardService(db)
    return await service.get_dashboard_metrics()
