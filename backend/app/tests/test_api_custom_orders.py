import json
import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.custom_order import CustomOrderRequest, CustomOrderStatus
from app.models.user import User, UserRole
from app.services.storage import LocalStorage, set_storage

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def spec(**over):
    base = {
        "segment": "INDIVIDUAL",
        "contact_name": "Meena Raj",
        "phone": "+91 98765 43210",
        "city": "Coimbatore",
        "preferred_contact": "whatsapp",
        "saree_type": "Wedding pattu saree",
        "occasion": "Wedding",
        "body_colour": "#8e1426",
        "border_colour": "#c6a15b",
        "pallu_colour": "#641b2b",
        "silk_type": "Pure mulberry silk",
        "silk_percentage": 100,
        "zari_type": "Tested zari",
        "design_notes": "Temple border like the photo, peacock butta in body.",
        "quantity": 2,
        "needed_by": (date.today() + timedelta(days=60)).isoformat(),
        "budget_range": "15k-25k",
    }
    base.update(over)
    return base


@pytest.fixture(autouse=True)
def tmp_storage(tmp_path):
    set_storage(LocalStorage(str(tmp_path)))
    yield tmp_path
    set_storage(None)


async def post(client: AsyncClient, payload: dict, files=None):
    return await client.post(
        "/api/v1/custom-orders",
        data={"payload": json.dumps(payload)},
        files=files or [],
    )


@pytest.mark.asyncio
async def test_submit_with_design_files_persists_spec_and_files(async_client, db_session: AsyncSession, tmp_storage):
    r = await post(
        async_client,
        spec(),
        files=[("files", ("my design.png", PNG, "image/png")), ("files", ("ref.jpg", JPG, "image/jpeg"))],
    )
    assert r.status_code == 201, r.text
    code = r.json()["reference_code"]
    assert code.startswith("PVS-") and len(code) == 10

    order = (await db_session.execute(select(CustomOrderRequest).where(CustomOrderRequest.reference_code == code))).scalar_one()
    assert order.status == CustomOrderStatus.NEW
    assert order.body_colour == "#8E1426"  # normalised
    assert order.silk_percentage == 100
    assert [a["content_type"] for a in order.attachments] == ["image/png", "image/jpeg"]
    assert order.attachments[0]["filename"] == "my design.png"
    for a in order.attachments:
        assert (tmp_storage / a["key"]).read_bytes() in (PNG, JPG)


@pytest.mark.asyncio
async def test_submit_without_files_is_allowed(async_client):
    r = await post(async_client, spec(segment="RETAILER", business_name="Lakshmi Boutique", quantity=25))
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_rejects_disguised_file(async_client, db_session):
    # .png name + image/png header, but the bytes are an executable script
    r = await post(async_client, spec(), files=[("files", ("design.png", b"#!/bin/sh\nrm -rf /", "image/png"))])
    assert r.status_code == 400
    assert "not a supported file" in r.text
    assert (await db_session.execute(select(CustomOrderRequest))).first() is None


@pytest.mark.asyncio
async def test_rejects_too_many_and_too_large_files(async_client):
    many = [("files", (f"d{i}.png", PNG, "image/png")) for i in range(6)]
    assert (await post(async_client, spec(), files=many)).status_code == 400
    big = PNG + b"\x00" * (10 * 1024 * 1024)
    assert (await post(async_client, spec(), files=[("files", ("big.png", big, "image/png"))])).status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "bad",
    [
        {"body_colour": "red"},
        {"phone": "12345"},
        {"silk_percentage": 120},
        {"quantity": 0},
        {"needed_by": (date.today() - timedelta(days=1)).isoformat()},
        {"segment": "SOMETHING"},
    ],
)
async def test_validation_errors(async_client, bad):
    assert (await post(async_client, spec(**bad))).status_code == 422


@pytest.mark.asyncio
async def test_invalid_json_payload(async_client):
    r = await async_client.post("/api/v1/custom-orders", data={"payload": "{not json"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_honeypot_stores_nothing(async_client, db_session):
    r = await post(async_client, spec(website="http://spam.example"))
    assert r.status_code == 201
    assert (await db_session.execute(select(CustomOrderRequest))).first() is None


@pytest.mark.asyncio
async def test_public_status_requires_matching_phone(async_client):
    code = (await post(async_client, spec())).json()["reference_code"]
    ok = await async_client.get("/api/v1/custom-orders/status", params={"ref": code.lower(), "phone": "9876543210"})
    assert ok.status_code == 200
    assert ok.json()["status_label"] == "Request received"
    wrong = await async_client.get("/api/v1/custom-orders/status", params={"ref": code, "phone": "9000000000"})
    missing = await async_client.get("/api/v1/custom-orders/status", params={"ref": "PVS-ZZZZZZ", "phone": "9876543210"})
    # identical response for both, so codes cannot be probed
    assert wrong.status_code == missing.status_code == 404
    assert wrong.json()["error"]["message"] == missing.json()["error"]["message"]


@pytest.fixture
async def staff_tokens(db_session: AsyncSession):
    sales = User(
        id=uuid.uuid4(), email="sales@pvs.test", hashed_password=get_password_hash("Pass123!"),
        full_name="Sales", role=UserRole.SALES_ADMIN, is_active=True,
    )
    dealer = User(
        id=uuid.uuid4(), email="dealer@pvs.test", hashed_password=get_password_hash("Pass123!"),
        full_name="Dealer", role=UserRole.DEALER, is_active=True,
    )
    db_session.add_all([sales, dealer])
    await db_session.commit()
    return {
        "sales": {"Authorization": f"Bearer {create_access_token(str(sales.id), sales.role.value)}"},
        "dealer": {"Authorization": f"Bearer {create_access_token(str(dealer.id), dealer.role.value)}"},
    }


@pytest.mark.asyncio
async def test_admin_pipeline_and_attachment_download(async_client, staff_tokens):
    code = (await post(async_client, spec(), files=[("files", ("d.png", PNG, "image/png"))])).json()["reference_code"]

    assert (await async_client.get("/api/v1/admin/custom-orders")).status_code == 401
    assert (await async_client.get("/api/v1/admin/custom-orders", headers=staff_tokens["dealer"])).status_code == 403

    lst = await async_client.get("/api/v1/admin/custom-orders", params={"search": code}, headers=staff_tokens["sales"])
    assert lst.status_code == 200 and lst.json()["total"] == 1
    oid = lst.json()["items"][0]["id"]
    assert lst.json()["items"][0]["attachment_count"] == 1

    upd = await async_client.patch(
        f"/api/v1/admin/custom-orders/{oid}",
        json={"status": "IN_PRODUCTION", "internal_notes": "Loom 3, warp ready"},
        headers=staff_tokens["sales"],
    )
    assert upd.status_code == 200 and upd.json()["status"] == "IN_PRODUCTION"

    st = await async_client.get("/api/v1/custom-orders/status", params={"ref": code, "phone": "+919876543210"})
    assert st.json()["status_label"] == "On the loom"

    f = await async_client.get(f"/api/v1/admin/custom-orders/{oid}/attachments/0", headers=staff_tokens["sales"])
    assert f.status_code == 200 and f.content == PNG
    assert (await async_client.get(f"/api/v1/admin/custom-orders/{oid}/attachments/0")).status_code == 401
    assert (await async_client.get(f"/api/v1/admin/custom-orders/{oid}/attachments/5", headers=staff_tokens["sales"])).status_code == 404

    bad = await async_client.patch(f"/api/v1/admin/custom-orders/{oid}", json={"status": "FLYING"}, headers=staff_tokens["sales"])
    assert bad.status_code == 422


@pytest.mark.asyncio
async def test_design_options_saved_and_validated(async_client, db_session, staff_tokens):
    opts = {
        "border_style": "gangaJamuna",
        "border_motif": "elephant",
        "body_pattern": "buttas",
        "body_motif": "peacock",
        "pallu_style": "grand",
        "pallu_motif": "lotus",
        "second_border_colour": "#c2185b",
    }
    r = await post(async_client, spec(design_options=opts))
    assert r.status_code == 201, r.text
    lst = await async_client.get("/api/v1/admin/custom-orders", headers=staff_tokens["sales"])
    oid = lst.json()["items"][0]["id"]
    det = await async_client.get(f"/api/v1/admin/custom-orders/{oid}", headers=staff_tokens["sales"])
    assert det.json()["design_options"]["second_border_colour"] == "#C2185B"
    assert det.json()["design_options"]["border_style"] == "gangaJamuna"

    assert (await post(async_client, spec(design_options={"border_style": "dragon"}))).status_code == 422
    assert (await post(async_client, spec(design_options={"hack": "x"}))).status_code == 422
