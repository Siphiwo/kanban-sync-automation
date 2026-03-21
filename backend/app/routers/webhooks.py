import base64
import hashlib
import hmac
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.services.sync_engine import process_webhook_event

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _get_webhook_secret(db: AsyncIOMotorDatabase, platform: str, identifier: str) -> str | None:
    doc = await db.webhook_secrets.find_one({"platform": platform, "identifier": identifier})
    return doc["secret"] if doc else None


async def _find_user_by_platform_id(db: AsyncIOMotorDatabase, platform: str, platform_user_id: str) -> str | None:
    user = await db.users.find_one({f"platforms.{platform}": {"$exists": True}})
    return user["_id"] if user else None


async def _find_user_by_webhook(db: AsyncIOMotorDatabase, platform: str, resource_id: str) -> str | None:
    doc = await db.webhook_registrations.find_one({"platform": platform, "resource_id": resource_id})
    return doc["user_id"] if doc else None


# ── Asana ──────────────────────────────────────────────────────────────────────

@router.post("/asana")
async def asana_webhook(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    x_hook_secret: str | None = Header(default=None),
    x_hook_signature: str | None = Header(default=None),
):
    # Handshake: echo X-Hook-Secret
    if x_hook_secret:
        return Response(status_code=200, headers={"X-Hook-Secret": x_hook_secret})

    raw = await request.body()
    body = await request.json()
    events = body.get("events", [])

    # Heartbeat (empty events)
    if not events:
        return Response(status_code=200)

    if not x_hook_signature:
        raise HTTPException(status_code=401, detail="Missing signature")

    # Verify signature using the stored secret for this webhook
    # Asana uses the X-Hook-Secret as the HMAC key
    resource_id = events[0].get("parent", {}).get("gid") or events[0].get("resource", {}).get("gid", "")
    secret = await _get_webhook_secret(db, "asana", resource_id)
    if secret:
        expected = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_hook_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")

    user_id = await _find_user_by_webhook(db, "asana", resource_id)
    if not user_id:
        return Response(status_code=200)

    for event in events:
        action_map = {"added": "created", "changed": "updated", "deleted": "deleted", "removed": "deleted"}
        action = action_map.get(event.get("action", ""), "updated")
        resource = event.get("resource", {})
        if resource.get("resource_type") != "task":
            continue
        event_data = {
            "task_id": resource.get("gid", ""),
            "project_id": (event.get("parent") or {}).get("gid", ""),
            "action": action,
        }
        await process_webhook_event("asana", event_data, user_id, db)

    return Response(status_code=200)


# ── Trello ─────────────────────────────────────────────────────────────────────

@router.head("/trello")
async def trello_webhook_head():
    return Response(status_code=200)


@router.post("/trello")
async def trello_webhook(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    x_trello_webhook: str | None = Header(default=None),
):
    raw = await request.body()

    if x_trello_webhook:
        callback_url = str(request.url)
        content = raw + callback_url.encode()
        expected = base64.b64encode(hmac.new(settings.TRELLO_API_SECRET.encode(), content, hashlib.sha1).digest()).decode()
        if not hmac.compare_digest(expected, x_trello_webhook):
            raise HTTPException(status_code=401, detail="Invalid signature")

    body = await request.json()
    action = body.get("action", {})
    action_type = action.get("type", "")
    card = action.get("data", {}).get("card", {})
    board = action.get("data", {}).get("board", {})

    if not card.get("id"):
        return Response(status_code=200)

    action_map = {
        "createCard": "created",
        "updateCard": "updated",
        "deleteCard": "deleted",
        "commentCard": "updated",
    }
    sync_action = action_map.get(action_type, "updated")

    user_id = await _find_user_by_webhook(db, "trello", board.get("id", ""))
    if not user_id:
        return Response(status_code=200)

    event_data = {
        "task_id": card["id"],
        "project_id": board.get("id", ""),
        "action": sync_action,
        "name": card.get("name", ""),
    }
    await process_webhook_event("trello", event_data, user_id, db)
    return Response(status_code=200)


# ── Monday ─────────────────────────────────────────────────────────────────────

@router.post("/monday")
async def monday_webhook(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    body = await request.json()

    # Challenge handshake
    if "challenge" in body:
        return {"challenge": body["challenge"]}

    event = body.get("event", {})
    event_type = event.get("type", "")
    board_id = str(event.get("boardId", ""))
    item_id = str(event.get("itemId", ""))

    action_map = {
        "create_item": "created",
        "delete_item": "deleted",
        "change_column_value": "updated",
        "change_status_column_value": "updated",
        "change_name": "updated",
        "create_update": "updated",
    }
    sync_action = action_map.get(event_type, "updated")

    user_id = await _find_user_by_webhook(db, "monday", board_id)
    if not user_id:
        return Response(status_code=200)

    event_data = {
        "task_id": item_id,
        "project_id": board_id,
        "action": sync_action,
        "name": event.get("itemName", ""),
    }
    await process_webhook_event("monday", event_data, user_id, db)
    return Response(status_code=200)


# ── Jira ───────────────────────────────────────────────────────────────────────

@router.post("/jira")
async def jira_webhook(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    x_hub_signature: str | None = Header(default=None),
):
    raw = await request.body()

    if x_hub_signature:
        algo, _, sig = x_hub_signature.partition("=")
        hash_fn = hashlib.sha256 if algo == "sha256" else hashlib.sha1
        # Jira webhook secret is stored globally per installation
        secret_doc = await db.webhook_secrets.find_one({"platform": "jira"})
        if secret_doc:
            expected = hmac.new(secret_doc["secret"].encode(), raw, hash_fn).hexdigest()
            if not hmac.compare_digest(expected, sig):
                raise HTTPException(status_code=401, detail="Invalid signature")

    body = await request.json()
    webhook_event = body.get("webhookEvent", "")
    issue = body.get("issue", {})
    issue_id = issue.get("id") or issue.get("key", "")
    project_key = issue.get("fields", {}).get("project", {}).get("key", "")

    event_map = {
        "jira:issue_created": "created",
        "jira:issue_updated": "updated",
        "jira:issue_deleted": "deleted",
    }
    sync_action = event_map.get(webhook_event, "updated")

    user_id = await _find_user_by_webhook(db, "jira", project_key)
    if not user_id:
        return Response(status_code=200)

    event_data = {
        "task_id": issue_id,
        "project_id": project_key,
        "action": sync_action,
        "summary": issue.get("fields", {}).get("summary", ""),
        "name": issue.get("fields", {}).get("summary", ""),
    }
    await process_webhook_event("jira", event_data, user_id, db)
    return Response(status_code=200)


# ── Linear ─────────────────────────────────────────────────────────────────────

@router.post("/linear")
async def linear_webhook(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    linear_signature: str | None = Header(default=None),
):
    raw = await request.body()
    body = await request.json()

    # Replay attack prevention
    webhook_ts = body.get("webhookTimestamp")
    if webhook_ts:
        age = time.time() - (webhook_ts / 1000)
        if age > 60:
            raise HTTPException(status_code=401, detail="Webhook timestamp too old")

    if linear_signature:
        team_id = body.get("data", {}).get("teamId", "")
        secret = await _get_webhook_secret(db, "linear", team_id)
        if secret:
            expected = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, linear_signature):
                raise HTTPException(status_code=401, detail="Invalid signature")

    action_map = {"create": "created", "update": "updated", "remove": "deleted"}
    sync_action = action_map.get(body.get("action", ""), "updated")
    event_type = body.get("type", "")

    if event_type != "Issue":
        return Response(status_code=200)

    data = body.get("data", {})
    team_id = data.get("teamId", "")

    user_id = await _find_user_by_webhook(db, "linear", team_id)
    if not user_id:
        return Response(status_code=200)

    event_data = {
        "task_id": data.get("id", ""),
        "project_id": team_id,
        "action": sync_action,
        "title": data.get("title", ""),
        "name": data.get("title", ""),
        "description": data.get("description", ""),
    }
    await process_webhook_event("linear", event_data, user_id, db)
    return Response(status_code=200)
