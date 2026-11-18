import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.custom_order import AdminCustomOrderDetail, AdminCustomOrderList, AdminCustomOrderUpdate
from app.services.custom_order_service import CustomOrderService
from app.services.storage import get_storage

router = APIRouter()

STAFF = require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)


@router.get("", response_model=PaginatedResponse[AdminCustomOrderList], summary="List custom saree requests")
async def list_custom_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None, max_length=100),
    current_user: User = Depends(STAFF),
    db: AsyncSession = Depends(get_db),
):
    return await CustomOrderService(db).admin_list(page, limit, status, search)


@router.get("/{order_id}", response_model=AdminCustomOrderDetail, summary="Custom saree request detail")
async def get_custom_order(order_id: uuid.UUID, current_user: User = Depends(STAFF), db: AsyncSession = Depends(get_db)):
    return await CustomOrderService(db).admin_detail(order_id)


@router.patch("/{order_id}", response_model=AdminCustomOrderDetail, summary="Update status / internal notes")
async def update_custom_order(
    order_id: uuid.UUID,
    payload: AdminCustomOrderUpdate,
    current_user: User = Depends(STAFF),
    db: AsyncSession = Depends(get_db),
):
    return await CustomOrderService(db).admin_update(order_id, payload)


@router.get("/{order_id}/attachments/{index}", summary="Open an uploaded design file (staff only)")
async def open_attachment(
    order_id: uuid.UUID, index: int, current_user: User = Depends(STAFF), db: AsyncSession = Depends(get_db)
):
    att = await CustomOrderService(db).attachment(order_id, index)
    storage = get_storage()
    url = await storage.signed_url(att["key"], expires_in=600)
    if url:
        return RedirectResponse(url, status_code=307)
    path = storage.local_path(att["key"])
    if not path:
        raise HTTPException(status_code=404, detail="File is no longer available")
    return FileResponse(path, media_type=att["content_type"], filename=att["filename"])
