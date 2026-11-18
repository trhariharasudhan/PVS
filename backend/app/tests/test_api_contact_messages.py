import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.contact_message import ContactMessage
from app.models.user import User, UserRole


@pytest.fixture
async def staff_headers(db_session: AsyncSession):
    sales = User(
        id=uuid.uuid4(), email="sales-contact@pvs.test", hashed_password=get_password_hash("Pass123!"),
        full_name="Sales", role=UserRole.SALES_ADMIN, is_active=True,
    )
    db_session.add(sales)
    await db_session.commit()
    return {"Authorization": f"Bearer {create_access_token(str(sales.id), sales.role.value)}"}


def msg(**over):
    base = {"name": "Kavitha", "phone": "+91 98765 43210", "subject": "Custom saree order", "message": "Can you weave a peacock pallu?", "language": "ta"}
    base.update(over)
    return base


@pytest.mark.asyncio
async def test_contact_message_is_stored(async_client: AsyncClient, db_session: AsyncSession):
    r = await async_client.post("/api/v1/contact", json=msg())
    assert r.status_code == 201
    rows = (await db_session.execute(select(ContactMessage))).scalars().all()
    assert len(rows) == 1
    assert rows[0].name == "Kavitha" and rows[0].language == "ta" and rows[0].status.value == "NEW"


@pytest.mark.asyncio
async def test_contact_validation_and_honeypot(async_client: AsyncClient, db_session: AsyncSession):
    assert (await async_client.post("/api/v1/contact", json=msg(phone="123"))).status_code == 422
    assert (await async_client.post("/api/v1/contact", json=msg(message="hi"))).status_code == 422
    assert (await async_client.post("/api/v1/contact", json=msg(language="fr"))).status_code == 422
    bot = await async_client.post("/api/v1/contact", json=msg(website="http://spam"))
    assert bot.status_code == 201
    assert (await db_session.execute(select(ContactMessage))).scalars().all() == []


@pytest.mark.asyncio
async def test_admin_can_list_and_update(async_client: AsyncClient, staff_headers):
    await async_client.post("/api/v1/contact", json=msg())
    assert (await async_client.get("/api/v1/admin/contact-messages")).status_code == 401
    lst = await async_client.get("/api/v1/admin/contact-messages", headers=staff_headers)
    assert lst.status_code == 200 and len(lst.json()) == 1
    mid = lst.json()[0]["id"]
    upd = await async_client.patch(f"/api/v1/admin/contact-messages/{mid}", json={"status": "REPLIED", "internal_notes": "Called back"}, headers=staff_headers)
    assert upd.status_code == 200 and upd.json()["status"] == "REPLIED"
    only_new = await async_client.get("/api/v1/admin/contact-messages", params={"status": "NEW"}, headers=staff_headers)
    assert only_new.json() == []
