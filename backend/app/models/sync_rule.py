from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class Platform(str, Enum):
    asana = "asana"
    trello = "trello"
    monday = "monday"
    jira = "jira"
    linear = "linear"


class FieldMapping(BaseModel):
    source_field: str
    target_field: str
    transform: Optional[Literal["none", "uppercase", "lowercase", "truncate"]] = "none"


class SyncRule(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    name: str
    source_platform: Platform
    source_project_id: str
    target_platform: Platform
    target_project_id: str
    field_mappings: list[FieldMapping] = []
    filters: Optional[dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class SyncRuleCreate(BaseModel):
    name: str
    source_platform: Platform
    source_project_id: str
    target_platform: Platform
    target_project_id: str
    field_mappings: list[FieldMapping] = []
    filters: Optional[dict[str, Any]] = None
    is_active: bool = True


class SyncRuleUpdate(BaseModel):
    name: Optional[str] = None
    source_platform: Optional[Platform] = None
    source_project_id: Optional[str] = None
    target_platform: Optional[Platform] = None
    target_project_id: Optional[str] = None
    field_mappings: Optional[list[FieldMapping]] = None
    filters: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None
