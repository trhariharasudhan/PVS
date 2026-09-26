from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_dashboard_repository import AdminDashboardRepository
from app.schemas.admin.dashboard import AdminDashboardMetrics


class AdminDashboardService:
    def __init__(self, session: AsyncSession):
        self.repo = AdminDashboardRepository(session)

    async def get_dashboard_metrics(self) -> AdminDashboardMetrics:
        return await self.repo.get_metrics()
