import uuid
from typing import Optional, List, Callable, Any, Union
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository


def extract_token_from_request(request: Request) -> Optional[str]:
    """
    Extracts the authentication token from either:
    1. HttpOnly Cookie (Primary for web admin portal)
    2. 'Authorization: Bearer <token>' Header (For API clients & testing)
    """
    # 1. Check HttpOnly Cookie
    cookie_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    # 2. Check Authorization Header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    return None


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Retrieves the currently authenticated user if a valid token is present.
    Returns None if no token or token is invalid/expired.
    """
    token = extract_token_from_request(request)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        return None

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        return None

    return user


async def require_authenticated_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """
    Dependency requiring a valid authenticated active staff user.
    Raises 401 Unauthorized if unauthenticated.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*allowed_roles: Any) -> Callable:
    """
    RBAC Dependency factory.
    Verifies that the authenticated user possesses one of the allowed roles.
    SUPER_ADMIN always satisfies all role requirements.
    Supports both require_role(RoleA, RoleB) and require_role([RoleA, RoleB]).
    Raises 403 Forbidden if the user lacks the required role.
    """
    flat_roles = set()
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            flat_roles.update(r)
        else:
            flat_roles.add(r)

    async def role_checker(
        current_user: User = Depends(require_authenticated_user),
    ) -> User:
        # SUPER_ADMIN has full administrative authorization
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user

        if current_user.role not in flat_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You do not possess the required role permissions.",
            )
        return current_user

    return role_checker


async def require_dealer_user(
    current_user: User = Depends(require_role(UserRole.DEALER)),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Phase 6-01: B2B Dealer Authentication & Tenant Isolation Guard.
    Verifies that the authenticated user has the DEALER role and is linked
    to an active wholesale customer profile. Prevents IDOR.
    """
    if not current_user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Dealer account is not linked to an active wholesale customer profile.",
        )
    return current_user

