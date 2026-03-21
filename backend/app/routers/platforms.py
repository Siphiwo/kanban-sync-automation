from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.core.config import settings
from app.services.token_store import get_valid_access_token, get_token

router = APIRouter(prefix="/platforms", tags=["platforms"])

ASANA_BASE = "https://app.asana.com/api/1.0"
TRELLO_BASE = "https://api.trello.com/1"
MONDAY_API = "https://api.monday.com/v2"
LINEAR_API = "https://api.linear.app/graphql"


def _jira_base(cloud_id: str) -> str:
    return f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"


async def _get_token_or_401(db, user_id: str, platform: str) -> str:
    token = await get_valid_access_token(db, user_id, platform)
    if not token:
        raise HTTPException(status_code=401, detail=f"Not connected to {platform}")
    return token


@router.get("/{platform}/projects")
async def list_projects(
    platform: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    user_id = current_user["_id"]
    token = await _get_token_or_401(db, user_id, platform)

    async with httpx.AsyncClient() as client:
        if platform == "asana":
            r = await client.get(f"{ASANA_BASE}/workspaces", headers={"Authorization": f"Bearer {token}"})
            r.raise_for_status()
            workspaces = r.json()["data"]
            projects = []
            for ws in workspaces:
                pr = await client.get(f"{ASANA_BASE}/workspaces/{ws['gid']}/projects", headers={"Authorization": f"Bearer {token}"}, params={"limit": 100})
                pr.raise_for_status()
                for p in pr.json()["data"]:
                    projects.append({"id": p["gid"], "name": p["name"], "workspace": ws["name"]})
            return projects

        elif platform == "trello":
            r = await client.get(f"{TRELLO_BASE}/members/me/boards", params={"key": settings.TRELLO_API_KEY, "token": token, "fields": "id,name,closed"})
            r.raise_for_status()
            return [{"id": b["id"], "name": b["name"]} for b in r.json() if not b.get("closed")]

        elif platform == "monday":
            q = "{ boards(limit: 50) { id name workspace { id name } } }"
            r = await client.post(MONDAY_API, json={"query": q}, headers={"Authorization": f"Bearer {token}", "API-Version": "2025-04"})
            r.raise_for_status()
            return [{"id": b["id"], "name": b["name"], "workspace": b.get("workspace", {}).get("name")} for b in r.json()["data"]["boards"]]

        elif platform == "jira":
            token_data = await get_token(db, user_id, "jira")
            cloud_id = token_data.get("cloud_id") if token_data else None
            if not cloud_id:
                raise HTTPException(status_code=400, detail="Jira cloud ID not found")
            r = await client.get(f"{_jira_base(cloud_id)}/project/search", headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
            r.raise_for_status()
            return [{"id": p["key"], "name": p["name"]} for p in r.json().get("values", [])]

        elif platform == "linear":
            q = "{ teams { nodes { id name key } } }"
            r = await client.post(LINEAR_API, json={"query": q}, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
            r.raise_for_status()
            return [{"id": t["id"], "name": t["name"], "key": t["key"]} for t in r.json()["data"]["teams"]["nodes"]]

    raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")


@router.get("/{platform}/projects/{project_id}/fields")
async def list_project_fields(
    platform: str,
    project_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    user_id = current_user["_id"]
    token = await _get_token_or_401(db, user_id, platform)

    async with httpx.AsyncClient() as client:
        if platform == "asana":
            r = await client.get(f"{ASANA_BASE}/projects/{project_id}", headers={"Authorization": f"Bearer {token}"}, params={"opt_fields": "custom_field_settings.custom_field.gid,custom_field_settings.custom_field.name,custom_field_settings.custom_field.type"})
            r.raise_for_status()
            fields = [{"id": "name", "name": "Name", "type": "text"}, {"id": "notes", "name": "Description", "type": "text"}, {"id": "assignee", "name": "Assignee", "type": "user"}, {"id": "due_on", "name": "Due Date", "type": "date"}]
            for cf in r.json()["data"].get("custom_field_settings", []):
                f = cf.get("custom_field", {})
                if f.get("gid"):
                    fields.append({"id": f["gid"], "name": f.get("name", ""), "type": f.get("type", "text")})
            return fields

        elif platform == "trello":
            r = await client.get(f"{TRELLO_BASE}/boards/{project_id}/customFields", params={"key": settings.TRELLO_API_KEY, "token": token})
            r.raise_for_status()
            fields = [{"id": "name", "name": "Name", "type": "text"}, {"id": "desc", "name": "Description", "type": "text"}, {"id": "due", "name": "Due Date", "type": "date"}, {"id": "idList", "name": "List", "type": "list"}]
            for f in r.json():
                fields.append({"id": f["id"], "name": f["name"], "type": f.get("type", "text")})
            return fields

        elif platform == "monday":
            q = "query($id: [ID!]) { boards(ids: $id) { columns { id title type } } }"
            r = await client.post(MONDAY_API, json={"query": q, "variables": {"id": [project_id]}}, headers={"Authorization": f"Bearer {token}", "API-Version": "2025-04"})
            r.raise_for_status()
            boards = r.json()["data"]["boards"]
            if not boards:
                return []
            return [{"id": c["id"], "name": c["title"], "type": c["type"]} for c in boards[0]["columns"]]

        elif platform == "jira":
            token_data = await get_token(db, user_id, "jira")
            cloud_id = token_data.get("cloud_id") if token_data else None
            if not cloud_id:
                raise HTTPException(status_code=400, detail="Jira cloud ID not found")
            r = await client.get(f"{_jira_base(cloud_id)}/field", headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
            r.raise_for_status()
            return [{"id": f["id"], "name": f["name"], "type": f.get("schema", {}).get("type", "string")} for f in r.json()]

        elif platform == "linear":
            q = """query($id: String!) { team(id: $id) { states { nodes { id name type } } labels { nodes { id name } } } }"""
            r = await client.post(LINEAR_API, json={"query": q, "variables": {"id": project_id}}, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
            r.raise_for_status()
            team = r.json()["data"]["team"]
            fields = [{"id": "title", "name": "Title", "type": "text"}, {"id": "description", "name": "Description", "type": "text"}, {"id": "priority", "name": "Priority", "type": "number"}, {"id": "stateId", "name": "State", "type": "state", "options": team["states"]["nodes"]}, {"id": "assigneeId", "name": "Assignee", "type": "user"}]
            return fields

    raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")
