import json

from openai import AsyncOpenAI

from app.core.config import settings
from app.models.sync_rule import FieldMapping, SyncRule, SyncRuleCreate
from app.models.sync_log import SyncEvent

SYSTEM_PROMPT = """You are a helpful assistant for Smart Kanban Sync, a tool that syncs tasks between project management platforms. Your job is to help users set up sync rules through conversation.

Guide the user through these steps:
1. Ask which platform they want to sync FROM and which project/board
2. Ask which platform they want to sync TO and which project/board  
3. Ask what condition should trigger the sync (e.g. when a task is created, when status changes to X)
4. Confirm the rule back to the user in plain language

When you have enough information to create a complete sync rule, include a JSON block in your response with this exact format:
{{"intent_complete": true, "sync_rule": {{"name": "...", "source_platform": "...", "source_project_id": "...", "target_platform": "...", "target_project_id": "...", "field_mappings": [], "filters": {{}}}}}}

Available platforms: asana, trello, monday, jira, linear
Connected platforms for this user: {connected_platforms}
Available projects: {available_projects}

Be concise, friendly, and smart. Don't ask for information you already have."""

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def parse_sync_intent(
    user_message: str,
    connected_platforms: list[str],
    available_projects: dict,
) -> SyncRuleCreate:
    response = await _client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "Extract a sync rule from the user's message. Return structured JSON.",
            },
            {"role": "user", "content": f"Platforms: {connected_platforms}\nProjects: {available_projects}\nMessage: {user_message}"},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "sync_rule_create",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "source_platform": {"type": "string", "enum": ["asana", "trello", "monday", "jira", "linear"]},
                        "source_project_id": {"type": "string"},
                        "target_platform": {"type": "string", "enum": ["asana", "trello", "monday", "jira", "linear"]},
                        "target_project_id": {"type": "string"},
                        "field_mappings": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "source_field": {"type": "string"},
                                    "target_field": {"type": "string"},
                                    "transform": {"type": "string", "enum": ["none", "uppercase", "lowercase", "truncate"]},
                                },
                                "required": ["source_field", "target_field", "transform"],
                                "additionalProperties": False,
                            },
                        },
                        "filters": {"type": "object", "additionalProperties": True},
                        "is_active": {"type": "boolean"},
                    },
                    "required": ["name", "source_platform", "source_project_id", "target_platform", "target_project_id", "field_mappings", "filters", "is_active"],
                    "additionalProperties": False,
                },
            },
        },
    )
    data = json.loads(response.choices[0].message.content)
    return SyncRuleCreate(**data)


async def suggest_field_mappings(
    source_platform: str,
    source_fields: list[str],
    target_platform: str,
    target_fields: list[str],
) -> list[FieldMapping]:
    response = await _client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": f"Suggest sensible field mappings from {source_platform} to {target_platform}.\nSource fields: {source_fields}\nTarget fields: {target_fields}",
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "field_mappings",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "mappings": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "source_field": {"type": "string"},
                                    "target_field": {"type": "string"},
                                    "transform": {"type": "string", "enum": ["none", "uppercase", "lowercase", "truncate"]},
                                },
                                "required": ["source_field", "target_field", "transform"],
                                "additionalProperties": False,
                            },
                        }
                    },
                    "required": ["mappings"],
                    "additionalProperties": False,
                },
            },
        },
    )
    data = json.loads(response.choices[0].message.content)
    return [FieldMapping(**m) for m in data["mappings"]]


async def generate_sync_summary(sync_rule: SyncRule, recent_logs: list[SyncEvent]) -> str:
    success = sum(1 for e in recent_logs if e.status == "success")
    failed = sum(1 for e in recent_logs if e.status == "failed")
    response = await _client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Write a one-sentence natural language summary for this sync rule.\n"
                    f"Rule: {sync_rule.name} ({sync_rule.source_platform} → {sync_rule.target_platform})\n"
                    f"Last 24h: {success} succeeded, {failed} failed out of {len(recent_logs)} total events."
                ),
            }
        ],
    )
    return response.choices[0].message.content.strip()


async def continue_conversation(messages: list[dict], context: dict) -> str:
    system = SYSTEM_PROMPT.format(
        connected_platforms=context.get("connected_platforms", []),
        available_projects=context.get("available_projects", {}),
    )
    response = await _client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": system}] + messages,
    )
    return response.choices[0].message.content
