from typing import Optional

from pydantic import BaseModel

from app.models.sync_rule import FieldMapping, SyncRuleCreate


class ConversationMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ConversationRequest(BaseModel):
    messages: list[ConversationMessage]
    context: dict  # connected_platforms, available_projects


class ConversationResponse(BaseModel):
    message: str
    parsed_rule: Optional[SyncRuleCreate] = None
    suggested_mappings: Optional[list[FieldMapping]] = None


class SyncSummaryRequest(BaseModel):
    sync_rule_id: str


class SyncSummaryResponse(BaseModel):
    summary: str
