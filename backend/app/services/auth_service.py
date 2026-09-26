import uuid
from typing import Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import UserPublic


class AuthService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    async def authenticate(self, email: str, password: str) -> Tuple[UserPublic, str]:
        """
        Authenticate staff credentials.
        Returns safe UserPublic representation and signed JWT access token.
        Raises 401 on invalid credentials or inactive accounts without leaking email existence.
        """
        user = await self.repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive. Please contact your system administrator.",
            )

        # Update last login timestamp
        await self.repo.update_last_login(user.id)

        # Generate JWT token
        token = create_access_token(
            subject=str(user.id),
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            extra_claims={"email": user.email},
        )

        user_public = UserPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
        )

        return user_public, token

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[UserPublic]:
        """Retrieve user public details by ID."""
        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            return None
        return UserPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
        )
