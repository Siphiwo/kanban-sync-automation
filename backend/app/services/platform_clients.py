import json

import httpx

ASANA_BASE = "https://app.asana.com/api/1.0"
TRELLO_BASE = "https://api.trello.com/1"
MONDAY_API = "https://api.monday.com/v2"
LINEAR_API = "https://api.linear.app/graphql"


def _jira_base(cloud_id: str) -> str:
    return f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"


def _asana_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _monday_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "API-Version": "2025-04"}


def _jira_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/json", "Content-Type": "application/json"}


def _linear_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


async def _monday_gql(client: httpx.AsyncClient, token: str, query: str, variables: dict | None = None) -> dict:
    payload: dict = {"query": query}
    if variables:
        payload["variables"] = variables
    r = await client.post(MONDAY_API, json=payload, headers=_monday_headers(token))
    r.raise_for_status()
    return r.json()


async def _linear_gql(client: httpx.AsyncClient, token: str, query: str, variables: dict | None = None) -> dict:
    payload: dict = {"query": query}
    if variables:
        payload["variables"] = variables
    r = await client.post(LINEAR_API, json=payload, headers=_linear_headers(token))
    r.raise_for_status()
    return r.json()


async def create_task(platform: str, access_token: str, project_id: str, task_data: dict, cloud_id: str | None = None) -> dict:
    async with httpx.AsyncClient() as client:
        if platform == "asana":
            body = {"data": {"name": task_data.get("name", ""), "notes": task_data.get("notes", ""), "projects": [project_id]}}
            if task_data.get("assignee"):
                body["data"]["assignee"] = task_data["assignee"]
            if task_data.get("due_on"):
                body["data"]["due_on"] = task_data["due_on"]
            r = await client.post(f"{ASANA_BASE}/tasks", json=body, headers=_asana_headers(access_token))
            r.raise_for_status()
            return r.json()["data"]

        elif platform == "trello":
            params = {"key": access_token.split(":")[0] if ":" in access_token else "", "token": access_token, "idList": project_id, "name": task_data.get("name", ""), "desc": task_data.get("desc", "")}
            if task_data.get("due"):
                params["due"] = task_data["due"]
            r = await client.post(f"{TRELLO_BASE}/cards", params=params)
            r.raise_for_status()
            return r.json()

        elif platform == "monday":
            col_vals = {k: v for k, v in task_data.items() if k not in ("name", "board_id", "group_id")}
            q = """mutation($board: ID!, $group: String, $name: String!, $cols: JSON) {
  create_item(board_id: $board, group_id: $group, item_name: $name, column_values: $cols) { id name }
}"""
            data = await _monday_gql(client, access_token, q, {"board": project_id, "group": task_data.get("group_id"), "name": task_data.get("name", ""), "cols": json.dumps(col_vals) if col_vals else None})
            return data["data"]["create_item"]

        elif platform == "jira":
            body = {"fields": {"project": {"key": project_id}, "summary": task_data.get("summary", task_data.get("name", "")), "issuetype": {"name": task_data.get("issuetype", "Task")}}}
            if task_data.get("description"):
                body["fields"]["description"] = {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": task_data["description"]}]}]}
            r = await client.post(f"{_jira_base(cloud_id)}/issue", json=body, headers=_jira_headers(access_token))
            r.raise_for_status()
            return r.json()

        elif platform == "linear":
            q = """mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title } } }"""
            inp = {"teamId": project_id, "title": task_data.get("title", task_data.get("name", ""))}
            if task_data.get("description"):
                inp["description"] = task_data["description"]
            if task_data.get("stateId"):
                inp["stateId"] = task_data["stateId"]
            if task_data.get("assigneeId"):
                inp["assigneeId"] = task_data["assigneeId"]
            data = await _linear_gql(client, access_token, q, {"input": inp})
            return data["data"]["issueCreate"]["issue"]

    raise ValueError(f"Unknown platform: {platform}")


async def update_task(platform: str, access_token: str, task_id: str, task_data: dict, cloud_id: str | None = None) -> dict:
    async with httpx.AsyncClient() as client:
        if platform == "asana":
            body = {"data": task_data}
            r = await client.put(f"{ASANA_BASE}/tasks/{task_id}", json=body, headers=_asana_headers(access_token))
            r.raise_for_status()
            return r.json()["data"]

        elif platform == "trello":
            params = {"key": access_token.split(":")[0] if ":" in access_token else "", "token": access_token, **task_data}
            r = await client.put(f"{TRELLO_BASE}/cards/{task_id}", params=params)
            r.raise_for_status()
            return r.json()

        elif platform == "monday":
            board_id = task_data.pop("board_id", None)
            results = []
            for col_id, value in task_data.items():
                q = """mutation($board: ID!, $item: ID!, $col: String!, $val: String!) {
  change_column_value(board_id: $board, item_id: $item, column_id: $col, value: $val) { id }
}"""
                data = await _monday_gql(client, access_token, q, {"board": board_id, "item": task_id, "col": col_id, "val": json.dumps(value) if not isinstance(value, str) else value})
                results.append(data["data"]["change_column_value"])
            return results[-1] if results else {}

        elif platform == "jira":
            fields = {k: v for k, v in task_data.items()}
            if "description" in fields and isinstance(fields["description"], str):
                fields["description"] = {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": fields["description"]}]}]}
            r = await client.put(f"{_jira_base(cloud_id)}/issue/{task_id}", json={"fields": fields}, headers=_jira_headers(access_token))
            r.raise_for_status()
            return {"id": task_id}

        elif platform == "linear":
            q = """mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { id title } } }"""
            data = await _linear_gql(client, access_token, q, {"id": task_id, "input": task_data})
            return data["data"]["issueUpdate"]["issue"]

    raise ValueError(f"Unknown platform: {platform}")


async def delete_task(platform: str, access_token: str, task_id: str, cloud_id: str | None = None) -> bool:
    async with httpx.AsyncClient() as client:
        if platform == "asana":
            r = await client.delete(f"{ASANA_BASE}/tasks/{task_id}", headers=_asana_headers(access_token))
            r.raise_for_status()
            return True

        elif platform == "trello":
            params = {"key": access_token.split(":")[0] if ":" in access_token else "", "token": access_token}
            r = await client.delete(f"{TRELLO_BASE}/cards/{task_id}", params=params)
            r.raise_for_status()
            return True

        elif platform == "monday":
            q = "mutation($id: ID!) { delete_item(item_id: $id) { id } }"
            await _monday_gql(client, access_token, q, {"id": task_id})
            return True

        elif platform == "jira":
            r = await client.delete(f"{_jira_base(cloud_id)}/issue/{task_id}", headers=_jira_headers(access_token))
            r.raise_for_status()
            return True

        elif platform == "linear":
            q = "mutation($id: String!) { issueDelete(id: $id) { success } }"
            data = await _linear_gql(client, access_token, q, {"id": task_id})
            return data["data"]["issueDelete"]["success"]

    raise ValueError(f"Unknown platform: {platform}")


async def add_comment(platform: str, access_token: str, task_id: str, comment_text: str, cloud_id: str | None = None) -> dict:
    async with httpx.AsyncClient() as client:
        if platform == "asana":
            r = await client.post(f"{ASANA_BASE}/tasks/{task_id}/stories", json={"data": {"text": comment_text}}, headers=_asana_headers(access_token))
            r.raise_for_status()
            return r.json()["data"]

        elif platform == "trello":
            params = {"key": access_token.split(":")[0] if ":" in access_token else "", "token": access_token, "text": comment_text}
            r = await client.post(f"{TRELLO_BASE}/cards/{task_id}/actions/comments", params=params)
            r.raise_for_status()
            return r.json()

        elif platform == "monday":
            q = "mutation($item: ID!, $body: String!) { create_update(item_id: $item, body: $body) { id body } }"
            data = await _monday_gql(client, access_token, q, {"item": task_id, "body": comment_text})
            return data["data"]["create_update"]

        elif platform == "jira":
            body = {"body": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": comment_text}]}]}}
            r = await client.post(f"{_jira_base(cloud_id)}/issue/{task_id}/comment", json=body, headers=_jira_headers(access_token))
            r.raise_for_status()
            return r.json()

        elif platform == "linear":
            q = "mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success comment { id body } } }"
            data = await _linear_gql(client, access_token, q, {"input": {"issueId": task_id, "body": comment_text}})
            return data["data"]["commentCreate"]["comment"]

    raise ValueError(f"Unknown platform: {platform}")
