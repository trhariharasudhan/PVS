from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.schemas.health import HealthResponse, ReadinessResponse
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from fastapi import Response, Depends

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_production:
        prod_errors = settings.validate_production_readiness()
        if prod_errors:
            for err in prod_errors:
                logger.error(f"[PRODUCTION CONFIG ERROR] {err}")
            raise RuntimeError(
                f"Production configuration validation failed: {'; '.join(prod_errors)}"
            )
        logger.info("[STARTUP] PVS Silk S API initialized in verified PRODUCTION mode.")
    else:
        logger.info(f"[STARTUP] PVS Silk S API initialized in {settings.ENVIRONMENT.upper()} mode.")
    yield


# Configure API Docs (Enabled in dev/staging; disabled in production unless DEBUG is true)
enable_docs = settings.is_development or settings.is_staging or settings.DEBUG

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RESTful API for PVS Silk S — Silk Saree Manufacturer & Emerging Textile Brand.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if enable_docs else None,
    docs_url=f"{settings.API_V1_STR}/docs" if enable_docs else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if enable_docs else None,
    lifespan=lifespan,
)

# CORS Middleware configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )


from app.core.logging_config import correlation_id_ctx, redact_sensitive_data
import uuid


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware extracting or generating correlation/request IDs,
    attaching them to ContextVar context, request.state, and response headers.
    """
    async def dispatch(self, request: Request, call_next):
        cid = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID") or str(uuid.uuid4())
        correlation_id_ctx.set(cid)
        request.state.correlation_id = cid

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = cid
        response.headers["X-Request-ID"] = cid
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware injecting strict defense-in-depth HTTP security headers on all responses.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CorrelationIdMiddleware)


# Standardized Global Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    cid = getattr(request.state, "correlation_id", None) or correlation_id_ctx.get()
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "correlation_id": cid,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    cid = getattr(request.state, "correlation_id", None) or correlation_id_ctx.get()
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field,
            "message": err.get("msg", "Invalid input"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request payload failed input validation.",
                "details": errors,
                "correlation_id": cid,
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    cid = getattr(request.state, "correlation_id", None) or correlation_id_ctx.get()
    logger.error(f"[ERROR] [cid:{cid}] Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later or contact support.",
                "correlation_id": cid,
            }
        },
    )


# Root liveness probe endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def root_health() -> HealthResponse:
    """Root liveness probe endpoint confirming process is alive."""
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
    )


# Root readiness probe endpoint
@app.get("/ready", response_model=ReadinessResponse, tags=["Health"])
async def root_ready(
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ReadinessResponse:
    """Root readiness probe endpoint confirming database connectivity."""
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


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
