# Monday.com Platform Spec

**Docs**: https://developer.monday.com/api-reference/  
**API Endpoint**: `https://api.monday.com/v2`  
**API Version**: `2025-04` (current stable as of 2026)  
**Last verified**: March 2026

---

## Auth: OAuth 2.0

**Authorization URL**:
```
https://auth.monday.com/oauth2/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &state=RANDOM_STATE
  &scope=boards:read boards:write
```

**Token URL**: `POST https://auth.monday.com/oauth2/token`

**Key scopes**:
- `boards:read` / `boards:write` — read/write boards and items
- `updates:read` / `updates:write` — read/write updates (comments)
- `webhooks:write` — create/delete webhooks
- `users:read` — read user info
- `workspaces:read` — read workspaces

**Token refresh**: Standard OAuth2 refresh token via `POST https://auth.monday.com/oauth2/token` with `grant_type=refresh_token`.

**Personal API token** (for testing): Available in Monday.com profile → Admin → API.

---

## Python SDK

Official SDK:
```bash
pip install monday-api-python-sdk
```

Or use `httpx`/`requests` directly with GraphQL — the SDK is thin and direct GraphQL is often clearer.

**Direct GraphQL approach** (recommended):
```python
import httpx

MONDAY_API_URL = "https://api.monday.com/v2"
HEADERS = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
    "API-Version": "2025-04"
}

def monday_query(query: str, variables: dict = None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = httpx.post(MONDAY_API_URL, json=payload, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()
```

---

## GraphQL API

### Boards & Workspaces

**List boards**:
```graphql
query {
  boards(limit: 50) {
    id
    name
    workspace { id name }
    groups { id title }
    columns { id title type }
  }
}
```

**List workspaces**:
```graphql
query {
  workspaces {
    id
    name
  }
}
```

### Items (Tasks)

**List items on a board** (paginated):
```graphql
query {
  boards(ids: [BOARD_ID]) {
    items_page(limit: 50, cursor: null) {
      cursor
      items {
        id
        name
        state
        group { id title }
        column_values {
          id
          text
          value
          column { title type }
        }
        created_at
        updated_at
      }
    }
  }
}
```

**Get single item**:
```graphql
query {
  items(ids: [ITEM_ID]) {
    id
    name
    state
    column_values { id text value }
    updates { id body created_at creator { name } }
  }
}
```

**Create item**:
```graphql
mutation {
  create_item(
    board_id: BOARD_ID,
    group_id: "GROUP_ID",
    item_name: "New task",
    column_values: "{\"status\": {\"label\": \"In Progress\"}, \"text\": \"Some value\"}"
  ) {
    id
    name
  }
}
```

**Update item name**:
```graphql
mutation {
  change_simple_column_value(
    board_id: BOARD_ID,
    item_id: ITEM_ID,
    column_id: "name",
    value: "Updated name"
  ) {
    id
  }
}
```

**Update column value**:
```graphql
mutation {
  change_column_value(
    board_id: BOARD_ID,
    item_id: ITEM_ID,
    column_id: "status",
    value: "{\"label\": \"Done\"}"
  ) {
    id
  }
}
```

**Delete item**:
```graphql
mutation {
  delete_item(item_id: ITEM_ID) {
    id
  }
}
```

### Updates (Comments)

**Get updates on an item**:
```graphql
query {
  items(ids: [ITEM_ID]) {
    updates(limit: 25) {
      id
      body
      created_at
      updated_at
      creator { id name }
      replies {
        id
        body
        creator { name }
      }
    }
  }
}
```

**Add update (comment)**:
```graphql
mutation {
  create_update(
    item_id: ITEM_ID,
    body: "Your comment here"
  ) {
    id
    body
    created_at
  }
}
```

**Delete update**:
```graphql
mutation {
  delete_update(id: UPDATE_ID) {
    id
  }
}
```

---

## Webhooks

Monday.com webhooks are configured via the UI (Automations) or via the API.

**Register webhook via API**: `POST https://api.monday.com/v2/webhooks`

```json
{
  "board_id": 123456789,
  "url": "https://yourapp.com/webhooks/monday",
  "event": "create_item"
}
```

**Supported events**:
- `create_item` — item created
- `change_column_value` — any column value changed
- `change_status_column_value` — status column changed
- `change_name` — item name changed
- `delete_item` — item deleted
- `create_update` — update (comment) added
- `edit_update` — update edited
- `delete_update` — update deleted
- `create_subitem` — subitem created

**Webhook payload**:
```json
{
  "event": {
    "type": "create_item",
    "userId": 12345,
    "boardId": 987654321,
    "itemId": 111222333,
    "itemName": "New task",
    "groupId": "group_id",
    "app": "monday",
    "triggerTime": "2026-03-21T10:00:00.000Z",
    "subscriptionId": 444555666,
    "triggerUuid": "uuid-here"
  }
}
```

**Challenge verification**: Monday.com sends a `challenge` field on first registration — echo it back:
```python
@app.post("/webhooks/monday")
async def monday_webhook(request: Request):
    body = await request.json()
    if "challenge" in body:
        return {"challenge": body["challenge"]}
    # process event...
```

---

## Column Types & Field Mapping

Common column types and how to set their values:

| Column Type | `column_id` example | Value format |
|-------------|---------------------|--------------|
| Status | `status` | `{"label": "Done"}` |
| Text | `text` | `"plain string"` |
| Numbers | `numbers` | `"42"` |
| Date | `date` | `{"date": "2026-04-01"}` |
| Person | `person` | `{"personsAndTeams": [{"id": USER_ID, "kind": "person"}]}` |
| Timeline | `timeline` | `{"from": "2026-04-01", "to": "2026-04-30"}` |

Get column definitions: `boards(ids: [ID]) { columns { id title type settings_str } }`

---

## Rate Limits

| Limit type | Value |
|------------|-------|
| Complexity per query | 5,000,000 points |
| Complexity per minute (app token) | 5M reads + 5M writes |
| Daily calls (Pro) | 10,000 (soft) |
| Daily calls (Enterprise) | 25,000 (soft) |
| Requests per minute (Enterprise) | 5,000 |
| Requests per minute (Pro) | 2,500 |
| Requests per minute (Other) | 1,000 |
| Concurrent requests (Enterprise) | 250 |
| IP limit | 5,000 per 10 seconds |

Check complexity in your query:
```graphql
mutation {
  complexity { query before after }
  create_item(board_id: ID, item_name: "test") { id }
}
```

---

## Pagination

Items use cursor-based pagination:
```graphql
query($cursor: String) {
  boards(ids: [BOARD_ID]) {
    items_page(limit: 100, cursor: $cursor) {
      cursor   # null when no more pages
      items { id name }
    }
  }
}
```

---

## Gotchas

- Monday uses **GraphQL only** — no REST endpoints for data operations
- Column values are JSON strings, not objects — must be serialized: `json.dumps({"label": "Done"})`
- `items_page` replaces the old `items` query (deprecated) — always use `items_page` for listing
- Status column values use `label` (display name), not an ID — labels must match exactly
- Webhooks are board-scoped — one webhook per board per event type
- The `challenge` handshake must be handled or webhook registration fails
- API versioning: always include `API-Version: 2025-04` header to avoid breaking changes
- Subitems are separate items with their own board — query via `subitems` field on parent item
- `items` query (direct, not via board) max returns 100 items — use board's `items_page` for full lists
