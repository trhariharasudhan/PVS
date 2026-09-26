"""Admin Provisioning CLI Utility for PVS Silk S.

Creates or updates a SUPER_ADMIN staff account in PostgreSQL without storing plaintext credentials.
Credentials can be provided via environment variables (ADMIN_EMAIL, ADMIN_PASSWORD) or CLI arguments.
"""

import asyncio
import os
import sys
import argparse
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_or_update_admin(email: str, password: str, full_name: str = "System Super Administrator"):
    """Provisions a SUPER_ADMIN user account with Argon2id hashed password."""
    if not email or not password:
        print("[ERROR] Both email and password are required to create an admin account.")
        sys.exit(1)

    if len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long.")
        sys.exit(1)

    normalized_email = email.lower().strip()
    hashed = get_password_hash(password)

    async with AsyncSessionLocal() as session:
        query = select(User).where(User.email == normalized_email)
        result = await session.execute(query)
        existing_user = result.scalars().first()

        if existing_user:
            existing_user.hashed_password = hashed
            existing_user.full_name = full_name
            existing_user.role = UserRole.SUPER_ADMIN
            existing_user.is_active = True
            await session.commit()
            print(f"[SUCCESS] Admin account for '{normalized_email}' has been updated to SUPER_ADMIN.")
        else:
            new_admin = User(
                email=normalized_email,
                hashed_password=hashed,
                full_name=full_name,
                role=UserRole.SUPER_ADMIN,
                is_active=True,
            )
            session.add(new_admin)
            await session.commit()
            print(f"[SUCCESS] Super Admin account '{normalized_email}' successfully created.")


def main():
    parser = argparse.ArgumentParser(description="Provision PVS Silk S Super Admin Account")
    parser.add_argument("--email", help="Admin email address", default=os.getenv("ADMIN_EMAIL", "admin@pvssilks.local"))
    parser.add_argument("--password", help="Admin password", default=os.getenv("ADMIN_PASSWORD"))
    parser.add_argument("--name", help="Admin full name", default="Super Administrator")
    args = parser.parse_args()

    email = args.email
    password = args.password

    if not password:
        # Prompt securely if not in env
        import getpass
        print(f"Provisioning Admin: {email}")
        password = getpass.getpass("Enter secure admin password: ")

    asyncio.run(create_or_update_admin(email, password, args.name))


if __name__ == "__main__":
    main()
