"""
Custom (made-to-order) saree requests: create with design uploads, public status
lookup, and admin pipeline management.
"""
from __future__ import annotations

import math
import re
import secrets
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_order import CustomerSegment, CustomOrderRequest, CustomOrderStatus
from app.schemas.common import PaginatedResponse
from app.schemas.custom_order import (
    STATUS_LABELS,
    AdminCustomOrderDetail,
    AdminCustomOrderList,
    AdminCustomOrderUpdate,
    AttachmentInfo,
    CustomOrderCreate,
    CustomOrderPublicStatus,
    CustomOrderSubmitted,
)
from app.services.storage import (
    EXTENSIONS,
    MAX_FILE_BYTES,
    MAX_FILES,
    StorageError,
    StoredFile,
    get_storage,
    safe_filename,
    sniff_content_type,
)

# Unambiguous characters (no 0/O, 1/I/L) so codes are easy to read over the phone.
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _new_code() -> str:
    return "PVS-" + "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))


def _phone_key(phone: str) -> str:
    """Last 10 digits — tolerant of +91 / spaces / dashes."""
    return re.sub(r"\D", "", phone)[-10:]


def _bad_request(msg: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


class CustomOrderService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------ public

    async def _read_uploads(self, files: List[UploadFile]) -> List[Tuple[bytes, str, str]]:
        files = [f for f in files if f is not None and (f.filename or "")]
        if len(files) > MAX_FILES:
            raise _bad_request(f"You can upload at most {MAX_FILES} design files.")
        out: List[Tuple[bytes, str, str]] = []
        for f in files:
            data = await f.read(MAX_FILE_BYTES + 1)
            if len(data) == 0:
                continue
            if len(data) > MAX_FILE_BYTES:
                raise _bad_request(f"'{safe_filename(f.filename or '')}' is larger than 10 MB.")
            ctype = sniff_content_type(data)
            if ctype is None:
                raise _bad_request(
                    f"'{safe_filename(f.filename or '')}' is not a supported file. Use JPG, PNG, WEBP, HEIC or PDF."
                )
            out.append((data, ctype, safe_filename(f.filename or "design")))
        return out

    async def _unique_code(self) -> str:
        for _ in range(8):
            code = _new_code()
            exists = await self.session.scalar(
                select(func.count()).select_from(CustomOrderRequest).where(CustomOrderRequest.reference_code == code)
            )
            if not exists:
                return code
        raise HTTPException(status_code=500, detail="Could not allocate a reference code, please retry.")

    async def submit(self, data: CustomOrderCreate, files: List[UploadFile]) -> CustomOrderSubmitted:
        if data.website:  # honeypot tripped: pretend success, store nothing
            return CustomOrderSubmitted(reference_code="PVS-000000", status="received", message="Thank you.")

        uploads = await self._read_uploads(files)
        code = await self._unique_code()

        stored: List[StoredFile] = []
        if uploads:
            try:
                storage = get_storage()
                for i, (blob, ctype, name) in enumerate(uploads):
                    key = f"{datetime.now(timezone.utc):%Y/%m}/{code}/{i + 1}-{uuid.uuid4().hex[:8]}.{EXTENSIONS[ctype]}"
                    await storage.put(key, blob, ctype)
                    stored.append(StoredFile(key=key, filename=name, content_type=ctype, size=len(blob)))
            except StorageError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Design upload is temporarily unavailable. Please send your design on WhatsApp instead.",
                ) from e

        order = CustomOrderRequest(
            id=uuid.uuid4(),
            reference_code=code,
            segment=CustomerSegment(data.segment),
            contact_name=data.contact_name.strip(),
            phone=data.phone.strip(),
            email=data.email.strip() if data.email else None,
            city=data.city.strip() if data.city else None,
            business_name=data.business_name.strip() if data.business_name else None,
            preferred_contact=data.preferred_contact,
            saree_type=data.saree_type.strip(),
            occasion=data.occasion.strip() if data.occasion else None,
            body_colour=data.body_colour,
            border_colour=data.border_colour,
            pallu_colour=data.pallu_colour,
            silk_type=data.silk_type.strip(),
            silk_percentage=data.silk_percentage,
            zari_type=data.zari_type.strip(),
            border_style=data.border_style.strip() if data.border_style else None,
            design_notes=data.design_notes.strip() if data.design_notes else None,
            design_options=data.design_options.model_dump(exclude_none=True) if data.design_options else None,
            quantity=data.quantity,
            needed_by=data.needed_by,
            budget_range=data.budget_range,
            attachments=[s.__dict__ for s in stored],
            consent_to_contact=data.consent_to_contact,
            status=CustomOrderStatus.NEW,
        )
        self.session.add(order)
        await self.session.commit()

        return CustomOrderSubmitted(
            reference_code=code,
            status="received",
            message="Your custom saree request has been received. PVS will contact you to confirm the design, materials and quotation.",
        )

    async def public_status(self, reference_code: str, phone: str) -> CustomOrderPublicStatus:
        order = await self.session.scalar(
            select(CustomOrderRequest).where(CustomOrderRequest.reference_code == reference_code.strip().upper())
        )
        # Same response for "not found" and "wrong phone" so codes can't be probed.
        if not order or _phone_key(order.phone) != _phone_key(phone):
            raise HTTPException(status_code=404, detail="No order found for that reference code and phone number.")
        return CustomOrderPublicStatus(
            reference_code=order.reference_code,
            status=order.status.value,
            status_label=STATUS_LABELS[order.status.value],
            saree_type=order.saree_type,
            quantity=order.quantity,
            updated_at=order.updated_at,
        )

    # ------------------------------------------------------------------- admin

    async def _get(self, order_id: uuid.UUID) -> CustomOrderRequest:
        order = await self.session.get(CustomOrderRequest, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Custom order not found")
        return order

    async def admin_list(
        self, page: int, limit: int, status_filter: Optional[str], search: Optional[str]
    ) -> PaginatedResponse[AdminCustomOrderList]:
        q = select(CustomOrderRequest)
        if status_filter:
            try:
                q = q.where(CustomOrderRequest.status == CustomOrderStatus(status_filter))
            except ValueError as e:
                raise _bad_request("Unknown status filter") from e
        if search:
            like = f"%{search.strip()}%"
            q = q.where(
                or_(
                    CustomOrderRequest.reference_code.ilike(like),
                    CustomOrderRequest.contact_name.ilike(like),
                    CustomOrderRequest.phone.ilike(like),
                    CustomOrderRequest.city.ilike(like),
                )
            )
        total = await self.session.scalar(select(func.count()).select_from(q.subquery())) or 0
        rows = (
            await self.session.scalars(
                q.order_by(CustomOrderRequest.created_at.desc()).offset((page - 1) * limit).limit(limit)
            )
        ).all()
        items = [
            AdminCustomOrderList(
                id=r.id,
                reference_code=r.reference_code,
                segment=r.segment.value,
                contact_name=r.contact_name,
                phone=r.phone,
                city=r.city,
                saree_type=r.saree_type,
                quantity=r.quantity,
                needed_by=r.needed_by,
                status=r.status.value,
                attachment_count=len(r.attachments or []),
                created_at=r.created_at,
            )
            for r in rows
        ]
        return PaginatedResponse[AdminCustomOrderList](
            items=items, total=total, page=page, limit=limit, total_pages=max(1, math.ceil(total / limit))
        )

    def _detail(self, r: CustomOrderRequest) -> AdminCustomOrderDetail:
        return AdminCustomOrderDetail(
            id=r.id,
            reference_code=r.reference_code,
            segment=r.segment.value,
            contact_name=r.contact_name,
            phone=r.phone,
            email=r.email,
            city=r.city,
            business_name=r.business_name,
            preferred_contact=r.preferred_contact,
            saree_type=r.saree_type,
            occasion=r.occasion,
            body_colour=r.body_colour,
            border_colour=r.border_colour,
            pallu_colour=r.pallu_colour,
            silk_type=r.silk_type,
            silk_percentage=r.silk_percentage,
            zari_type=r.zari_type,
            border_style=r.border_style,
            design_notes=r.design_notes,
            design_options=r.design_options,
            quantity=r.quantity,
            needed_by=r.needed_by,
            budget_range=r.budget_range,
            attachments=[
                AttachmentInfo(index=i, filename=a["filename"], content_type=a["content_type"], size=a["size"])
                for i, a in enumerate(r.attachments or [])
            ],
            status=r.status.value,
            internal_notes=r.internal_notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

    async def admin_detail(self, order_id: uuid.UUID) -> AdminCustomOrderDetail:
        return self._detail(await self._get(order_id))

    async def admin_update(self, order_id: uuid.UUID, payload: AdminCustomOrderUpdate) -> AdminCustomOrderDetail:
        order = await self._get(order_id)
        if payload.status is not None:
            order.status = CustomOrderStatus(payload.status)
        if payload.internal_notes is not None:
            order.internal_notes = payload.internal_notes
        await self.session.commit()
        await self.session.refresh(order)
        return self._detail(order)

    async def attachment(self, order_id: uuid.UUID, index: int) -> dict:
        order = await self._get(order_id)
        atts = order.attachments or []
        if index < 0 or index >= len(atts):
            raise HTTPException(status_code=404, detail="Attachment not found")
        return atts[index]
