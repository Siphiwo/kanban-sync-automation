# Linear Platform Spec

**Docs**: https://linear.app/developers/graphql  
**API Endpoint**: `https://api.linear.app/graphql`  
**Last verified**: March 2026

---

## Auth: OAuth 2.0

**Authorization URL**:
```
https://linear.app/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &state=RANDOM_STATE
  &scope=read,write
```

**Token URL**: `POST https://api.linear.app/oauth/token`
```json
{
  "grant_type": "authorization_code",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "YOUR_REDIRECT_URI",
  "code": "AUTH_CODE"
}
```

**Token refresh**: `POST https://api.linear.app/oauth/token` with `grant_type=refresh_token`.

**Key scopes**:
- `read` — read all data (issues, comments, teams, projects)
- `write` — create/update/delete issues, comments
- `issues:create` — create issues only
- `admin` — admin operations, create/read webhooks

> Only workspace admins or OAuth apps with `admin` scope can create/read webhooks.

---

## Python Library

Community wrapper:
```bash
pip install linear-api
```

Or direct GraphQL with `httpx` (recommended for full control):
```python
import httpx

LINEAR_API = "https://api.linear.app/graphql"

def linear_query(query: str, variables: dict = None, access_token: str = ""):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = httpx.post(LINEAR_API, json=payload, headers=headers)
    resp.raise_for_status()
    return resp.json()
```

---

## GraphQL API

### Teams & Projects

**List teams**:
```graphql
query {
  teams {
    nodes {
      id
      name
      key
      states { nodes { id name type } }
      labels { nodes { id name color } }
    }
  }
}
```

**List projects**:
```graphql
query {
  projects {
    nodes {
      id
      name
      state
      teams { nodes { id name } }
    }
  }
}
```

### Issues (Tasks)

**List issues** (paginated):
```graphql
query($after: String) {
  issues(first: 50, after: $after, filter: { team: { id: { eq: "TEAM_ID" } } }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      identifier
      title
      description
      state { id name type }
      assignee { id name email }
      priority
      priorityLabel
      labels { nodes { id name } }
      createdAt
      updatedAt
    }
  }
}
```

**Get single issue**:
```graphql
query {
  issue(id: "ISSUE_ID") {
    id
    identifier
    title
    description
    state { id name type }
    assignee { id name }
    comments { nodes { id body createdAt user { name } } }
  }
}
```

**Create issue**:
```graphql
mutation {
  issueCreate(input: {
    teamId: "TEAM_ID"
    title: "Issue title"
    description: "Description in markdown"
    stateId: "STATE_ID"
    assigneeId: "USER_ID"
    priority: 2
    labelIds: ["LABEL_ID"]
  }) {
    success
    issue {
      id
      identifier
      title
    }
  }
}
```

**Priority values**: `0` = No priority, `1` = Urgent, `2` = High, `3` = Medium, `4` = Low

**Update issue**:
```graphql
mutation {
  issueUpdate(id: "ISSUE_ID", input: {
    title: "Updated title"
    stateId: "NEW_STATE_ID"
    assigneeId: "USER_ID"
  }) {
    success
    issue { id title }
  }
}
```

**Delete issue**:
```graphql
mutation {
  issueDelete(id: "ISSUE_ID") {
    success
  }
}
```

### Comments

**Get comments on issue**:
```graphql
query {
  issue(id: "ISSUE_ID") {
    comments {
      nodes {
        id
        body
        createdAt
        updatedAt
        user { id name email }
        parent { id }
      }
    }
  }
}
```

**Add comment**:
```graphql
mutation {
  commentCreate(input: {
    issueId: "ISSUE_ID"
    body: "Your comment in markdown"
  }) {
    success
    comment {
      id
      body
      createdAt
    }
  }
}
```

**Update comment**:
```graphql
mutation {
  commentUpdate(id: "COMMENT_ID", input: { body: "Updated comment" }) {
    success
    comment { id body }
  }
}
```

**Delete comment**:
```graphql
mutation {
  commentDelete(id: "COMMENT_ID") {
    success
  }
}
```

### Issue States

States represent the workflow status (equivalent to "list" in Trello or "status" in Jira).

```graphql
query {
  workflowStates(filter: { team: { id: { eq: "TEAM_ID" } } }) {
    nodes {
      id
      name
      type   # "triage", "backlog", "unstarted", "started", "completed", "cancelled"
      color
      position
    }
  }
}
```

---

## Webhooks

**Create webhook via API**:
```graphql
mutation {
  webhookCreate(input: {
    url: "https://yourapp.com/webhooks/linear"
    teamId: "TEAM_ID"
    resourceTypes: ["Issue", "Comment", "IssueLabel", "Project"]
  }) {
    success
    webhook {
      id
      enabled
    }
  }
}
```

Use `allPublicTeams: true` instead of `teamId` to watch all teams.

**Supported resource types**:
- `Issue`, `IssueLabel`, `Comment`, `Reaction`
- `Project`, `ProjectUpdate`
- `Cycle`, `Document`
- `User`

**Delete webhook**:
```graphql
mutation {
  webhookDelete(id: "WEBHOOK_ID") {
    success
  }
}
```

**Webhook payload headers**:
```
Linear-Delivery: <uuid>
Linear-Event: Issue
Linear-Signature: <hmac-sha256-hex>
Content-Type: application/json
```

**Webhook payload body**:
```json
{
  "action": "create",
  "type": "Issue",
  "createdAt": "2026-03-21T10:00:00.000Z",
  "organizationId": "ORG_ID",
  "webhookId": "WEBHOOK_ID",
  "webhookTimestamp": 1711015200000,
  "actor": {
    "id": "USER_ID",
    "type": "user",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "data": {
    "id": "ISSUE_ID",
    "createdAt": "2026-03-21T10:00:00.000Z",
    "updatedAt": "2026-03-21T10:00:00.000Z",
    "title": "Issue title",
    "description": "...",
    "priority": 2,
    "teamId": "TEAM_ID",
    "stateId": "STATE_ID",
    "assigneeId": "USER_ID"
  },
  "updatedFrom": {
    "stateId": "OLD_STATE_ID"
  }
}
```

**Actions**: `create`, `update`, `remove`

**Signature verification** (HMAC-SHA256):
```python
import hmac, hashlib

def verify_linear_webhook(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
```

**Replay attack prevention**: Check `webhookTimestamp` is within 60 seconds of current time.

**Retry policy**: 3 retries with 1 minute, 1 hour, 6 hour backoff. Webhook disabled if URL stays unresponsive.

**Webhook source IPs**:
- `35.231.147.226`
- `35.243.134.228`
- `34.140.253.14`
- `34.38.87.206`
- `34.134.222.122`
- `35.222.25.142`

---

## Rate Limits

Linear uses adaptive rate limiting. From official docs:
- Requests are limited per API token
- Returns `429` with `Retry-After` header when exceeded
- GraphQL complexity is tracked — avoid deeply nested queries
- Pagination: use `first`/`after` cursor pattern, max 250 nodes per page

---

## Pagination

Cursor-based (Relay-style):
```graphql
query($after: String) {
  issues(first: 50, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes { id title }
  }
}
```
Pass `endCursor` as `after` in the next request. Stop when `hasNextPage` is `false`.

---

## Gotchas

- Linear uses **GraphQL only** — no REST API
- Issue descriptions use **Markdown** (not ADF like Jira)
- **Webhook creation requires `admin` scope** — ensure this is in your OAuth scopes
- `updatedFrom` in webhook payload shows previous values — useful for detecting what changed
- Issue `identifier` (e.g. `ENG-42`) is human-readable; `id` is the UUID — use `id` for API calls
- States are team-specific — fetch states per team, not globally
- Linear has no "project" in the Trello/Asana sense — "teams" are the primary grouping, "projects" are optional
- Comments support **threaded replies** via `parentId` on `commentCreate`
- The `type` field on `workflowState` maps to semantic meaning: `completed`/`cancelled` are terminal states
- Webhook payload includes full `data` object — no need for a follow-up fetch in most cases
