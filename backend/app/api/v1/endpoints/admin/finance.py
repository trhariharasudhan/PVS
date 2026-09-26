from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.admin.finance import (
    FinanceOverviewKPIs,
    CustomerOutstandingDetail,
    SupplierOutstandingDetail,
)
from app.services.admin.admin_finance_service import AdminFinanceService
from app.api.deps import require_role

router = APIRouter()


@router.get("/overview", response_model=FinanceOverviewKPIs)
async def get_finance_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve macro financial KPIs: Gross Revenue, Receivables, Payables, Net Cash Flow, Tax Liabilities."""
    service = AdminFinanceService(db)
    return await service.get_overview_kpis()


@router.get("/receivables", response_model=List[CustomerOutstandingDetail])
async def get_customer_receivables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve customer outstanding receivables with aging buckets (0-30, 31-60, 61-90, 90+ days)."""
    service = AdminFinanceService(db)
    return await service.get_receivables_aging()


@router.get("/payables", response_model=List[SupplierOutstandingDetail])
async def get_supplier_payables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve supplier payables with aging breakdown."""
    service = AdminFinanceService(db)
    return await service.get_payables_aging()
