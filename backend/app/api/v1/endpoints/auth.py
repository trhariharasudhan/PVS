from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, AuthResponse, UserPublic, MessageResponse
from app.models.user import User
from app.api.deps import require_authenticated_user

router = APIRouter()


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Admin Staff Login",
    description="Authenticate staff credentials and issue secure HttpOnly session cookie.",
)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    service = AuthService(db)
    user_public, token = await service.authenticate(payload.email, payload.password)

    # Set secure HttpOnly cookie for browser sessions
    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        secure=settings.COOKIE_SECURE or settings.is_production,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return AuthResponse(
        user=user_public,
        message="Staff session authenticated successfully.",
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Staff Logout",
    description="Invalidate and clear the staff session HttpOnly cookie.",
)
async def logout(
    response: Response,
) -> MessageResponse:
    # Clear session cookie
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE or settings.is_production,
        samesite=settings.COOKIE_SAMESITE,
    )
    return MessageResponse(message="Staff session logged out successfully.")


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get Current Authenticated Staff Profile",
    description="Retrieve identity, active status, and RBAC role for the current session.",
)
async def get_current_user(
    current_user: User = Depends(require_authenticated_user),
) -> UserPublic:
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at,
    )
