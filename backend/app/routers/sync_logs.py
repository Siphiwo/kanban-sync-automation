from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/sync-logs", tags=["sync-logs"])


@router.get("")
async def list_sync_logs(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    platform: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    query: dict = {"user_id": current_user["_id"]}
    if platform:
        query["$or"] = [{"source_platform": platform}, {"target_platform": platform}]
    if status:
        query["status"] = status

    skip = (page - 1) * page_size
    cursor = db.sync_logs.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    logs = await cursor.to_list(length=page_size)
    total = await db.sync_logs.count_documents(query)
    return {"items": logs, "total": total, "page": page, "page_size": page_size}


@router.get("/stats")
async def sync_stats(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    user_id = current_user["_id"]
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": {"source": "$source_platform", "target": "$target_platform", "status": "$status"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.sync_logs.aggregate(pipeline).to_list(length=None)

    total = 0
    success = 0
    per_platform: dict = {}

    for r in results:
        count = r["count"]
        total += count
        if r["_id"]["status"] == "success":
            success += count
        src = r["_id"]["source"]
        tgt = r["_id"]["target"]
        for p in (src, tgt):
            if p not in per_platform:
                per_platform[p] = {"total": 0, "success": 0, "failed": 0, "skipped": 0}
            per_platform[p]["total"] += count
            per_platform[p][r["_id"]["status"]] = per_platform[p].get(r["_id"]["status"], 0) + count

    return {
        "total": total,
        "success": success,
        "failed": total - success,
        "success_rate": round(success / total * 100, 1) if total else 0,
        "per_platform": per_platform,
    }
