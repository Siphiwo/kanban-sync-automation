# Asana Platform Spec

**Docs**: https://developers.asana.com/docs  
**API Base URL**: `https://app.asana.com/api/1.0`  
**Last verified**: March 2026

---

## Auth: OAuth 2.0

**Authorization URL**:
```
https://app.asana.com/-/oauth_authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &state=RANDOM_STATE
  &scope=default
```

**Token URL**: `POST https://app.asana.com/-/oauth_token`

**Scopes**:
- `default` — access to tasks, projects, workspaces, comments (stories), webhooks
- `openid` — OpenID Connect identity
- `email` / `profile` — user info

**Token refresh**: Standard OAuth2 refresh token flow via `POST https://app.asana.com/-/oauth_token` with `grant_type=refresh_token`.

> Note: Asana OAuth does NOT support token requests from a browser (no implicit flow).

---

## Python SDK

```bash
pip install asana
```

**SDK version**: v5 (current as of 2026)

```python
import asana
from asana.rest import ApiException

configuration = asana.Configuration()
configuration.access_token = 'YOUR_ACCESS_TOKEN'
api_client = asana.ApiClient(configuration)
```

---

## Key REST API Endpoints

All requests: `Authorization: Bearer <token>`, `Accept: application/json`

### Tasks

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List tasks in a project | GET | `/projects/{project_gid}/tasks` |
| Get task | GET | `/tasks/{task_gid}` |
| Create task | POST | `/tasks` |
| Update task | PUT | `/tasks/{task_gid}` |
| Delete task | DELETE | `/tasks/{task_gid}` |
| Search tasks in workspace | GET | `/workspaces/{workspace_gid}/tasks/search` |

**Create task body**:
```json
{
  "data": {
    "name": "Task name",
    "notes": "Description",
    "projects": ["PROJECT_GID"],
    "assignee": "USER_GID",
    "due_on": "2026-04-01"
  }
}
```

### Comments (Stories)

In Asana, comments are called **stories**.

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get comments on task | GET | `/tasks/{task_gid}/stories` |
| Add comment to task | POST | `/tasks/{task_gid}/stories` |
| Get story | GET | `/stories/{story_gid}` |
| Delete story | DELETE | `/stories/{story_gid}` |

**Add comment body**:
```json
{
  "data": {
    "text": "Your comment here"
  }
}
```

### Projects & Workspaces

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List workspaces | GET | `/workspaces` |
| List projects in workspace | GET | `/workspaces/{workspace_gid}/projects` |
| Get project | GET | `/projects/{project_gid}` |
| List sections in project | GET | `/projects/{project_gid}/sections` |

---

## Webhooks

**Register webhook**: `POST /webhooks`

```json
{
  "data": {
    "resource": "PROJECT_OR_TASK_GID",
    "target": "https://yourapp.com/webhooks/asana",
    "filters": [
      { "resource_type": "task", "action": "changed" },
      { "resource_type": "task", "action": "added" },
      { "resource_type": "story", "action": "added" }
    ]
  }
}
```

**Handshake**: On registration, Asana sends a `POST` to your target URL with an `X-Hook-Secret` header. Your server must echo it back in the response header with a `200` or `204` status.

**Signature verification**: Each event includes `X-Hook-Signature` (SHA256 HMAC of request body using the `X-Hook-Secret`).

**Event payload**:
```json
{
  "events": [
    {
      "action": "changed",
      "resource": { "gid": "TASK_GID", "resource_type": "task" },
      "parent": { "gid": "PROJECT_GID", "resource_type": "project" },
      "created_at": "2026-03-21T10:00:00.000Z",
      "user": { "gid": "USER_GID", "resource_type": "user" }
    }
  ]
}
```

**Actions**: `added`, `changed`, `deleted`, `removed`, `undeleted`

**Retry policy**: Retries for up to 24 hours with exponential backoff. Webhook deleted after 24h of failures.

**Heartbeat**: Empty payload sent every 8 hours to keep webhook alive. Must respond with 200.

**Limits**: 1,000 webhooks per resource, 10,000 per token.

---

## Custom Fields

- Fetch custom fields on a task via `GET /tasks/{task_gid}?opt_fields=custom_fields`
- Custom field values are in `custom_fields` array on the task object
- Each field has `gid`, `name`, `type` (`text`, `number`, `enum`, `date`, `people`)
- Update via `PUT /tasks/{task_gid}` with `custom_fields: { "FIELD_GID": "value" }`

---

## Rate Limits

- **1,500 requests per minute** per OAuth token (default)
- Returns `429 Too Many Requests` when exceeded
- `Retry-After` header indicates when to retry
- Use `opt_fields` to reduce response size and avoid extra requests

---

## Pagination

- Cursor-based: responses include `next_page.offset`
- Pass `offset=VALUE` and `limit=N` (max 100) as query params

---

## Gotchas

- Tasks can belong to multiple projects — always check `memberships` array
- Comments are "stories" — filter by `type: "comment"` to exclude system stories
- Webhook events are "compact" — you must fetch the full resource after receiving an event
- Story consolidation: rapid updates within 1 hour may be merged into one story
- Workspace GID ≠ Organization GID — use `/workspaces` to discover the right one
- `X-Hook-Secret` is only returned during handshake, not on subsequent fetches
- Higher-level webhooks (workspace/portfolio/team) **must** specify filters
