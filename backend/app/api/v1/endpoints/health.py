from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Liveness Probe")
async def api_health_check() -> HealthResponse:
    """
    Liveness probe confirming the FastAPI application process is alive and responsive.
    Does not require database access or authentication.
    """
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
    )


@router.get("/ready", response_model=ReadinessResponse, summary="Readiness Probe")
async def api_readiness_check(
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ReadinessResponse:
    """
    Readiness probe validating database connectivity and core dependency readiness.
    Returns HTTP 200 when database is responsive, HTTP 503 when disconnected.
    Never leaks connection strings, secrets, or internal stack traces.
    """
    db_connected = False
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            db_connected = True
    except Exception:
        db_connected = False

    if not db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="unavailable",
            environment=settings.ENVIRONMENT,
            database="disconnected",
            version=settings.VERSION,
        )

    return ReadinessResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        database="connected",
        version=settings.VERSION,
    )

