"""Production Database Initialization Script for PVS Silk S.

This script safely initializes the production database by ensuring a Super Admin
account exists based on explicit environment variables.

It NEVER inserts fake products, categories, suppliers, orders, inventory, or customers.
"""

import asyncio
import uuid
import sys
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings


async def init_production_admin():
    """Initializes the production super admin account if no admin exists."""
    admin_email = settings.ADMIN_INITIAL_EMAIL
    admin_password = settings.ADMIN_INITIAL_PASSWORD

    if not admin_password:
        print("[INIT-PROD ERROR] ADMIN_INITIAL_PASSWORD environment variable is required to create initial admin.")
        sys.exit(1)

    if len(admin_password) < 12:
        print("[INIT-PROD ERROR] ADMIN_INITIAL_PASSWORD must be at least 12 characters.")
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.role == UserRole.SUPER_ADMIN).limit(1)
        )
        existing_admin = result.scalars().first()

        if existing_admin:
            print(f"[INIT-PROD] An active Super Admin ({existing_admin.email}) already exists. No action required.")
            return

        print(f"[INIT-PROD] Creating initial production Super Admin: {admin_email}...")
        super_admin = User(
            id=uuid.uuid4(),
            email=admin_email.lower().strip(),
            hashed_password=get_password_hash(admin_password),
            full_name="PVS Silk S System Administrator",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        session.add(super_admin)
        await session.commit()
        print(f"[INIT-PROD SUCCESS] Super Admin created successfully: {admin_email}")


if __name__ == "__main__":
    asyncio.run(init_production_admin())
