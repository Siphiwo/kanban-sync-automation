from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SyncEvent(BaseModel):
    id: str = Field(alias="_id")
    sync_rule_id: str
    user_id: str
    source_platform: str
    target_platform: str
    source_task_id: str
    target_task_id: Optional[str] = None
    action: Literal["created", "updated", "deleted"]
    status: Literal["success", "failed", "skipped"]
    error_message: Optional[str] = None
    payload_hash: str
    created_at: datetime

    model_config = {"populate_by_name": True}
