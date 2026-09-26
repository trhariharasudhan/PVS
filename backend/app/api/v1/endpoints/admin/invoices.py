import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.invoice import InvoiceType, InvoiceStatus
from app.schemas.common import PaginatedResponse
from app.schemas.admin.invoice import (
    AdminInvoiceList,
    AdminInvoiceDetail,
    AdminInvoiceCreate,
    AdminInvoiceStatusUpdate,
    AdminInvoiceRecordPaymentPayload,
)
from app.services.admin.admin_invoice_service import AdminInvoiceService
from app.api.deps import require_role

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AdminInvoiceList])
async def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    invoice_type: Optional[InvoiceType] = None,
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status"),
    customer_id: Optional[uuid.UUID] = None,
    supplier_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """List all sales invoices and purchase bills with pagination and filters."""
    service = AdminInvoiceService(db)
    items, total = await service.get_invoices(
        page=page,
        limit=limit,
        invoice_type=invoice_type,
        status=status_filter,
        customer_id=customer_id,
        supplier_id=supplier_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, limit=limit)


@router.get("/{invoice_id}", response_model=AdminInvoiceDetail)
async def get_invoice_detail(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Retrieve full tax invoice or bill detail."""
    service = AdminInvoiceService(db)
    inv = await service.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return inv


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER])),
):
    """Generate and stream a professional print-ready PDF Tax Invoice for PVS Silk S."""
    service = AdminInvoiceService(db)
    try:
        pdf_bytes = await service.generate_pdf(invoice_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=PVS-Invoice-{invoice_id}.pdf"
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate PDF: {str(e)}")


@router.post("", response_model=AdminInvoiceDetail, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: AdminInvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN])),
):
    """Create a new manual Tax Invoice or Purchase Bill."""
    service = AdminInvoiceService(db)
    try:
        return await service.create_invoice(payload, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/from-order/{order_id}", response_model=AdminInvoiceDetail, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN])),
):
    """One-click generation of Tax Invoice from a confirmed Sales Order."""
    service = AdminInvoiceService(db)
    try:
        return await service.create_invoice_from_order(order_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{invoice_id}", response_model=AdminInvoiceDetail)
async def update_invoice_status(
    invoice_id: uuid.UUID,
    payload: AdminInvoiceStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN])),
):
    """Update invoice clearance / cancellation status."""
    service = AdminInvoiceService(db)
    try:
        return await service.update_invoice_status(invoice_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{invoice_id}/record-payment", response_model=AdminInvoiceDetail)
async def record_payment_against_invoice(
    invoice_id: uuid.UUID,
    payload: AdminInvoiceRecordPaymentPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN])),
):
    """Record customer remittance or supplier disbursement directly against an invoice."""
    service = AdminInvoiceService(db)
    try:
        return await service.record_payment(invoice_id, payload, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
