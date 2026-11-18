import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.custom_order import CustomOrderCreate, CustomOrderPublicStatus, CustomOrderSubmitted
from app.services.custom_order_service import CustomOrderService

router = APIRouter()


@router.post(
    "",
    response_model=CustomOrderSubmitted,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a custom (made-to-order) saree request",
    description=(
        "multipart/form-data: `payload` = JSON of the saree specification, "
        "`files` = up to 5 design references (JPG, PNG, WEBP, HEIC, PDF; 10 MB each)."
    ),
)
async def submit_custom_order(
    payload: str = Form(..., description="JSON-encoded CustomOrderCreate"),
    files: Optional[List[UploadFile]] = File(None),
    db: AsyncSession = Depends(get_db),
) -> CustomOrderSubmitted:
    try:
        data = CustomOrderCreate.model_validate(json.loads(payload))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail="payload must be valid JSON") from e
    except ValidationError as e:
        # Return the same shape as FastAPI's own validation errors
        raise HTTPException(
            status_code=422,
            detail=[{"field": ".".join(str(p) for p in err["loc"]), "message": err["msg"]} for err in e.errors()],
        ) from e
    return await CustomOrderService(db).submit(data, files or [])


@router.get(
    "/status",
    response_model=CustomOrderPublicStatus,
    summary="Check the status of a custom order",
    description="Requires both the reference code and the phone number used when ordering.",
)
async def custom_order_status(
    ref: str = Query(..., min_length=6, max_length=20),
    phone: str = Query(..., min_length=7, max_length=30),
    db: AsyncSession = Depends(get_db),
) -> CustomOrderPublicStatus:
    return await CustomOrderService(db).public_status(ref, phone)
