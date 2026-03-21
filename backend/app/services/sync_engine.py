import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.sync_rule import FieldMapping, SyncRule
from app.services.platform_clients import create_task, delete_task, update_task
from app.services.token_store import get_valid_access_token


def compute_payload_hash(platform: str, event_data: dict) -> str:
    key = {
        "platform": platform,
        "task_id": event_data.get("task_id") or event_data.get("id", ""),
        "action": event_data.get("action", ""),
        "name": event_data.get("name") or event_data.get("title") or event_data.get("summary", ""),
    }
    return hashlib.sha256(json.dumps(key, sort_keys=True).encode()).hexdigest()


async def is_duplicate(payload_hash: str, user_id: str, db: AsyncIOMotorDatabase) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    doc = await db.sync_logs.find_one({"payload_hash": payload_hash, "user_id": user_id, "created_at": {"$gte": cutoff}})
    return doc is not None


def apply_field_mappings(source_data: dict, mappings: list[FieldMapping]) -> dict:
    result = {}
    for m in mappings:
        value = source_data.get(m.source_field)
        if value is None:
            continue
        if isinstance(value, str):
            if m.transform == "uppercase":
                value = value.upper()
            elif m.transform == "lowercase":
                value = value.lower()
            elif m.transform == "truncate":
                value = value[:100]
        result[m.target_field] = value
    return result


async def find_matching_rules(user_id: str, source_platform: str, source_project_id: str, db: AsyncIOMotorDatabase) -> list[dict]:
    cursor = db.sync_rules.find({
        "user_id": user_id,
        "source_platform": source_platform,
        "source_project_id": source_project_id,
        "is_active": True,
    })
    return await cursor.to_list(length=100)


async def _log_event(db: AsyncIOMotorDatabase, rule: dict, source_task_id: str, target_task_id: str | None, action: str, status: str, payload_hash: str, error: str | None = None) -> None:
    await db.sync_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "sync_rule_id": rule["_id"],
        "user_id": rule["user_id"],
        "source_platform": rule["source_platform"],
        "target_platform": rule["target_platform"],
        "source_task_id": source_task_id,
        "target_task_id": target_task_id,
        "action": action,
        "status": status,
        "error_message": error,
        "payload_hash": payload_hash,
        "created_at": datetime.now(timezone.utc),
    })


async def execute_sync(rule: dict, event_data: dict, db: AsyncIOMotorDatabase) -> None:
    mappings = [FieldMapping(**m) for m in rule.get("field_mappings", [])]
    mapped = apply_field_mappings(event_data, mappings) if mappings else event_data.copy()
    action = event_data.get("action", "updated")
    source_task_id = event_data.get("task_id") or event_data.get("id", "")
    payload_hash = compute_payload_hash(rule["source_platform"], event_data)

    access_token = await get_valid_access_token(db, rule["user_id"], rule["target_platform"])
    if not access_token:
        await _log_event(db, rule, source_task_id, None, action, "failed", payload_hash, "No access token for target platform")
        return

    cloud_id = None
    if rule["target_platform"] == "jira":
        from app.services.token_store import get_token
        token_data = await get_token(db, rule["user_id"], "jira")
        cloud_id = token_data.get("cloud_id") if token_data else None

    # Trello needs api_key:token format for our client helpers
    if rule["target_platform"] == "trello":
        from app.core.config import settings
        access_token = f"{settings.TRELLO_API_KEY}:{access_token}"

    target_task_id = None
    try:
        if action == "created":
            result = await create_task(rule["target_platform"], access_token, rule["target_project_id"], mapped, cloud_id)
            target_task_id = str(result.get("id") or result.get("gid", ""))
        elif action == "updated":
            existing = await db.sync_logs.find_one({"sync_rule_id": rule["_id"], "source_task_id": source_task_id, "status": "success", "action": "created"})
            if existing and existing.get("target_task_id"):
                target_task_id = existing["target_task_id"]
                await update_task(rule["target_platform"], access_token, target_task_id, mapped, cloud_id)
            else:
                result = await create_task(rule["target_platform"], access_token, rule["target_project_id"], mapped, cloud_id)
                target_task_id = str(result.get("id") or result.get("gid", ""))
        elif action == "deleted":
            existing = await db.sync_logs.find_one({"sync_rule_id": rule["_id"], "source_task_id": source_task_id, "status": "success"})
            if existing and existing.get("target_task_id"):
                target_task_id = existing["target_task_id"]
                await delete_task(rule["target_platform"], access_token, target_task_id, cloud_id)

        await _log_event(db, rule, source_task_id, target_task_id, action, "success", payload_hash)
    except Exception as e:
        await _log_event(db, rule, source_task_id, target_task_id, action, "failed", payload_hash, str(e))


async def process_webhook_event(platform: str, event_data: dict, user_id: str, db: AsyncIOMotorDatabase) -> None:
    payload_hash = compute_payload_hash(platform, event_data)
    if await is_duplicate(payload_hash, user_id, db):
        return

    source_project_id = event_data.get("project_id", "")
    rules = await find_matching_rules(user_id, platform, source_project_id, db)
    for rule in rules:
        await execute_sync(rule, event_data, db)
