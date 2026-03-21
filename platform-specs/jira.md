# Jira Platform Spec

**Docs**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/  
**API Base URL**: `https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3`  
**Auth Docs**: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/  
**Last verified**: March 2026

---

## Auth: OAuth 2.0 (3LO — Three-Legged OAuth)

**Step 1 — Authorization URL**:
```
https://auth.atlassian.com/authorize
  ?audience=api.atlassian.com
  &client_id=YOUR_CLIENT_ID
  &scope=read:jira-work write:jira-work offline_access
  &redirect_uri=YOUR_REDIRECT_URI
  &state=RANDOM_STATE
  &response_type=code
  &prompt=consent
```

**Step 2 — Exchange code for token**:
```
POST https://auth.atlassian.com/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "AUTH_CODE",
  "redirect_uri": "YOUR_REDIRECT_URI"
}
```

**Step 3 — Get Cloud ID** (required for all API calls):
```
GET https://api.atlassian.com/oauth/token/accessible-resources
Authorization: Bearer ACCESS_TOKEN
```
Returns array of sites — extract `id` (this is the `cloudId`).

**Step 4 — API calls**:
```
https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/{endpoint}
Authorization: Bearer ACCESS_TOKEN
```

**Token refresh**: Include `offline_access` in scopes to get a refresh token.
```
POST https://auth.atlassian.com/oauth/token
{ "grant_type": "refresh_token", "client_id": ..., "client_secret": ..., "refresh_token": ... }
```
Refresh tokens rotate — always store the new one returned. Expire after 90 days of inactivity.

**Key scopes**:
- `read:jira-work` — read issues, comments, projects
- `write:jira-work` — create/update issues, comments
- `manage:jira-project` — manage projects
- `read:jira-user` — read user info
- `offline_access` — enables refresh tokens

---

## Python SDK

Official Atlassian Python library:
```bash
pip install atlassian-python-api
```

Or the community `jira` library:
```bash
pip install jira
```

**Direct REST approach** (recommended for OAuth 3LO):
```python
import httpx

class JiraClient:
    def __init__(self, access_token: str, cloud_id: str):
        self.base = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    def get(self, path: str, **params):
        return httpx.get(f"{self.base}{path}", headers=self.headers, params=params)

    def post(self, path: str, body: dict):
        return httpx.post(f"{self.base}{path}", headers=self.headers, json=body)
```

---

## Key REST API v3 Endpoints

### Projects

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List projects | GET | `/project/search` |
| Get project | GET | `/project/{projectIdOrKey}` |
| Get project statuses | GET | `/project/{projectIdOrKey}/statuses` |

### Issues (Tasks)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Search issues (JQL) | GET | `/search` |
| Get issue | GET | `/issue/{issueIdOrKey}` |
| Create issue | POST | `/issue` |
| Update issue | PUT | `/issue/{issueIdOrKey}` |
| Delete issue | DELETE | `/issue/{issueIdOrKey}` |
| Get transitions | GET | `/issue/{issueIdOrKey}/transitions` |
| Transition issue | POST | `/issue/{issueIdOrKey}/transitions` |

**Search with JQL**:
```
GET /search?jql=project=MYPROJECT AND status="In Progress"&fields=summary,status,assignee,description&maxResults=50&startAt=0
```

**Create issue body**:
```json
{
  "fields": {
    "project": { "key": "PROJ" },
    "summary": "Issue title",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "Description here" }] }
      ]
    },
    "issuetype": { "name": "Task" },
    "assignee": { "accountId": "USER_ACCOUNT_ID" },
    "priority": { "name": "Medium" }
  }
}
```

> Note: Jira API v3 uses **Atlassian Document Format (ADF)** for description/comment bodies — not plain text or markdown.

**Update issue** (partial update):
```json
{
  "fields": {
    "summary": "Updated title",
    "priority": { "name": "High" }
  }
}
```

**Transition issue** (change status):
```json
{ "transition": { "id": "TRANSITION_ID" } }
```
Get valid transition IDs first via `GET /issue/{key}/transitions`.

### Comments

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get comments | GET | `/issue/{issueIdOrKey}/comment` |
| Add comment | POST | `/issue/{issueIdOrKey}/comment` |
| Update comment | PUT | `/issue/{issueIdOrKey}/comment/{id}` |
| Delete comment | DELETE | `/issue/{issueIdOrKey}/comment/{id}` |

**Add comment body** (ADF format):
```json
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Your comment here" }] }
    ]
  }
}
```

---

## Webhooks

**Register webhook**: `POST /rest/api/3/webhook`

```json
{
  "url": "https://yourapp.com/webhooks/jira",
  "webhooks": [
    {
      "jqlFilter": "project = MYPROJECT",
      "events": ["jira:issue_created", "jira:issue_updated", "jira:issue_deleted", "comment_created", "comment_updated", "comment_deleted"]
    }
  ]
}
```

**List webhooks**: `GET /rest/api/3/webhook`  
**Delete webhook**: `DELETE /rest/api/3/webhook` (body: `{ "webhookIds": [ID] }`)  
**Refresh webhook** (extend expiry): `PUT /rest/api/3/webhook/refresh`

> Jira webhooks expire after 30 days — you must refresh them periodically.

**Webhook payload** (issue created):
```json
{
  "timestamp": 1711015200000,
  "webhookEvent": "jira:issue_created",
  "issue_event_type_name": "issue_created",
  "user": { "accountId": "USER_ID", "displayName": "John Doe" },
  "issue": {
    "id": "10001",
    "key": "PROJ-42",
    "fields": {
      "summary": "Issue title",
      "status": { "name": "To Do" },
      "issuetype": { "name": "Task" },
      "assignee": { "accountId": "USER_ID", "displayName": "Jane" },
      "priority": { "name": "Medium" },
      "description": { ... },
      "created": "2026-03-21T10:00:00.000+0000",
      "updated": "2026-03-21T10:00:00.000+0000"
    }
  }
}
```

**Key webhook events**:
- `jira:issue_created`
- `jira:issue_updated`
- `jira:issue_deleted`
- `comment_created`
- `comment_updated`
- `comment_deleted`

**Signature verification**: Jira includes `X-Hub-Signature` header (SHA256 HMAC). Verify against your webhook secret.

---

## Custom Fields

- Custom fields have IDs like `customfield_10001`
- `GET /field` — list all fields including custom ones
- Custom field values are in `issue.fields.customfield_XXXXX`
- Setting custom field values: include in `fields` object on create/update

---

## Rate Limits

Jira Cloud uses adaptive rate limiting — no fixed published numbers. Guidelines:
- Respect `Retry-After` header on `429` responses
- Use JQL `maxResults` (max 100 per page) and paginate with `startAt`
- Avoid polling — use webhooks for real-time updates
- Bulk operations available for creating/updating multiple issues

---

## Pagination

JQL search uses offset pagination:
```
GET /search?jql=project=PROJ&startAt=0&maxResults=50
```
Response includes `total`, `startAt`, `maxResults` — iterate until `startAt + maxResults >= total`.

---

## Gotchas

- **Cloud ID is required** — all API calls go through `api.atlassian.com/ex/jira/{cloudId}/`, not `your-domain.atlassian.net`
- **ADF format** — descriptions and comments must use Atlassian Document Format, not plain text
- **Webhooks expire in 30 days** — implement a refresh job (cron) to call `PUT /webhook/refresh`
- **Transitions, not direct status updates** — you can't set `status` directly; must use transitions
- **Issue types vary by project** — always fetch `GET /project/{key}/statuses` to know valid types/statuses
- **Custom fields are project-specific** — `customfield_10001` may mean different things in different projects
- **`accountId` not username** — Jira Cloud uses `accountId` for all user references
- **Scopes for Jira Software vs Jira Work Management differ** — `read:jira-work` covers both but check per endpoint
- **OAuth 3LO apps cannot use searchable entity properties in JQL** — known limitation
