import json
import re
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.llm import ConversationRequest, ConversationResponse, SyncSummaryResponse
from app.models.sync_rule import FieldMapping, SyncRule, SyncRuleCreate
from app.models.sync_log import SyncEvent
from app.services import llm_service
from app.routers.platforms import list_project_fields

router = APIRouter(prefix="/llm", tags=["llm"])


def _extract_parsed_rule(text: str) -> SyncRuleCreate | None:
    match = re.search(r'\{.*"intent_complete"\s*:\s*true.*\}', text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group())
        if data.get("intent_complete") and data.get("sync_rule"):
            return SyncRuleCreate(**data["sync_rule"])
    except Exception:
        pass
    return None


@router.post("/conversation", response_model=ConversationResponse)
async def conversation(
    req: ConversationRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply = await llm_service.continue_conversation(messages, req.context)
    parsed_rule = _extract_parsed_rule(reply)
    # Strip the JSON block from the visible message
    clean_reply = re.sub(r'\{.*"intent_complete"\s*:\s*true.*\}', "", reply, flags=re.DOTALL).strip()
    return ConversationResponse(
        message=clean_reply or reply,
        parsed_rule=parsed_rule,
    )


@router.post("/suggest-mappings", response_model=list[FieldMapping])
async def suggest_mappings(
    source_platform: str,
    source_project_id: str,
    target_platform: str,
    target_project_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    source_fields_data = await list_project_fields(source_platform, source_project_id, current_user, db)
    target_fields_data = await list_project_fields(target_platform, target_project_id, current_user, db)
    source_fields = [f["name"] for f in source_fields_data]
    target_fields = [f["name"] for f in target_fields_data]
    return await llm_service.suggest_field_mappings(source_platform, source_fields, target_platform, target_fields)


@router.get("/sync-summary/{sync_rule_id}", response_model=SyncSummaryResponse)
async def sync_summary(
    sync_rule_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    rule_doc = await db.sync_rules.find_one({"_id": sync_rule_id, "user_id": current_user["_id"]})
    if not rule_doc:
        raise HTTPException(status_code=404, detail="Sync rule not found")

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    cursor = db.sync_logs.find({
        "sync_rule_id": sync_rule_id,
        "user_id": current_user["_id"],
        "created_at": {"$gte": since},
    })
    logs = [SyncEvent(**doc) async for doc in cursor]
    rule = SyncRule(**rule_doc)
    summary = await llm_service.generate_sync_summary(rule, logs)
    return SyncSummaryResponse(summary=summary)
