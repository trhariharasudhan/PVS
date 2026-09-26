from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_finance_repository import AdminFinanceRepository
from app.schemas.admin.finance import (
    FinanceOverviewKPIs,
    CustomerOutstandingDetail,
    SupplierOutstandingDetail,
)


class AdminFinanceService:
    def __init__(self, db: AsyncSession):
        self.repo = AdminFinanceRepository(db)

    async def get_overview_kpis(self) -> FinanceOverviewKPIs:
        return await self.repo.get_overview_kpis()

    async def get_receivables_aging(self) -> List[CustomerOutstandingDetail]:
        return await self.repo.get_customer_receivables_aging()

    async def get_payables_aging(self) -> List[SupplierOutstandingDetail]:
        return await self.repo.get_supplier_payables_aging()
