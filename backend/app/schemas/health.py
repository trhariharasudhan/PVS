from typing import Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    environment: Optional[str] = None
    version: Optional[str] = None


class ReadinessResponse(BaseModel):
    status: str = "ok"
    environment: Optional[str] = None
    database: str = "connected"
    version: Optional[str] = None

