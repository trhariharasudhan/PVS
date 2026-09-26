from typing import Optional, Union
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.admin.reports import (
    SalesReportSummary,
    InventoryValuationReport,
    GSTSummaryReport,
)
from app.services.admin.admin_reports_service import AdminReportsService
from app.api.deps import require_role

router = APIRouter()


@router.get("/sales")
async def get_sales_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    customer_type: Optional[str] = None,
    order_type: Optional[str] = None,
    export: Optional[str] = Query(None, description="Set to 'csv' to download CSV file"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve Sales & Revenue Analytics Report with optional CSV export."""
    service = AdminReportsService(db)
    s_date = start_date or (date.today() - timedelta(days=30))
    e_date = end_date or date.today()

    if export == "csv":
        csv_data = await service.export_sales_csv(s_date, e_date, customer_type, order_type)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=PVS-Sales-Report-{s_date}-to-{e_date}.csv"},
        )

    return await service.get_sales_report(s_date, e_date, customer_type, order_type)


@router.get("/inventory-valuation")
async def get_inventory_valuation_report(
    export: Optional[str] = Query(None, description="Set to 'csv' to download CSV file"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve Raw Materials & Finished Goods Inventory Valuation Report with optional CSV export."""
    service = AdminReportsService(db)

    if export == "csv":
        csv_data = await service.export_inventory_valuation_csv()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=PVS-Inventory-Valuation-{date.today()}.csv"},
        )

    return await service.get_inventory_valuation()


@router.get("/gst")
async def get_gst_summary_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    export: Optional[str] = Query(None, description="Set to 'csv' to download CSV file"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve GST / Tax Summary Report (GSTR-1 HSN Ready) with optional CSV export."""
    service = AdminReportsService(db)
    s_date = start_date or (date.today() - timedelta(days=30))
    e_date = end_date or date.today()

    if export == "csv":
        csv_data = await service.export_gst_csv(s_date, e_date)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=PVS-GST-Report-{s_date}-to-{e_date}.csv"},
        )

    return await service.get_gst_summary(s_date, e_date)
