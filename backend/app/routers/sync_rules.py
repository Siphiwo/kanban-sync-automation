import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.sync_rule import SyncRuleCreate, SyncRuleUpdate

router = APIRouter(prefix="/sync-rules", tags=["sync-rules"])


def _rule_or_404(rule: dict | None) -> dict:
    if not rule:
        raise HTTPException(status_code=404, detail="Sync rule not found")
    return rule


@router.get("")
async def list_sync_rules(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    cursor = db.sync_rules.find({"user_id": current_user["_id"]})
    return await cursor.to_list(length=200)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_sync_rule(
    body: SyncRuleCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        **body.model_dump(),
        "source_platform": body.source_platform.value,
        "target_platform": body.target_platform.value,
        "field_mappings": [m.model_dump() for m in body.field_mappings],
        "created_at": now,
        "updated_at": now,
    }
    await db.sync_rules.insert_one(doc)
    return doc


@router.get("/{rule_id}")
async def get_sync_rule(
    rule_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    return _rule_or_404(await db.sync_rules.find_one({"_id": rule_id, "user_id": current_user["_id"]}))


@router.put("/{rule_id}")
async def update_sync_rule(
    rule_id: str,
    body: SyncRuleUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    updates = body.model_dump(exclude_none=True)
    if "source_platform" in updates:
        updates["source_platform"] = updates["source_platform"].value if hasattr(updates["source_platform"], "value") else updates["source_platform"]
    if "target_platform" in updates:
        updates["target_platform"] = updates["target_platform"].value if hasattr(updates["target_platform"], "value") else updates["target_platform"]
    if "field_mappings" in updates:
        updates["field_mappings"] = [m.model_dump() if hasattr(m, "model_dump") else m for m in updates["field_mappings"]]
    updates["updated_at"] = datetime.now(timezone.utc)

    result = await db.sync_rules.find_one_and_update(
        {"_id": rule_id, "user_id": current_user["_id"]},
        {"$set": updates},
        return_document=True,
    )
    return _rule_or_404(result)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sync_rule(
    rule_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    result = await db.sync_rules.delete_one({"_id": rule_id, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sync rule not found")


@router.patch("/{rule_id}/pause")
async def toggle_sync_rule(
    rule_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    rule = _rule_or_404(await db.sync_rules.find_one({"_id": rule_id, "user_id": current_user["_id"]}))
    result = await db.sync_rules.find_one_and_update(
        {"_id": rule_id},
        {"$set": {"is_active": not rule["is_active"], "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    return result
