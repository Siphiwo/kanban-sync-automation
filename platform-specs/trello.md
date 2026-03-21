# Trello Platform Spec

**Docs**: https://developer.atlassian.com/cloud/trello/  
**API Base URL**: `https://api.trello.com/1`  
**Last verified**: March 2026

---

## Auth: OAuth 1.0a + API Key/Token

Trello uses **OAuth 1.0a** for user authorization. Every request also requires an API Key.

**Step 1 — Get API Key**: https://trello.com/power-ups/admin  
**Step 2 — Request token**: `GET https://trello.com/1/OAuthGetRequestToken`  
**Step 3 — Authorize**: `https://trello.com/1/OAuthAuthorizeToken?oauth_token=TOKEN&scope=read,write&expiration=never`  
**Step 4 — Access token**: `GET https://trello.com/1/OAuthGetAccessToken`

**Scopes**: `read`, `write`, `account`

All API requests require `?key=API_KEY&token=ACCESS_TOKEN` as query params (or in the request body).

> Note: Trello does not support OAuth 2.0 for third-party integrations — it uses OAuth 1.0a.

---

## Python Library

No official Trello Python SDK. Best community library:

```bash
pip install py-trello
```

**Docs**: https://py-trello-dev.readthedocs.io/

```python
from trello import TrelloClient

client = TrelloClient(
    api_key='YOUR_API_KEY',
    api_secret='YOUR_API_SECRET',
    token='YOUR_OAUTH_TOKEN',
    token_secret='YOUR_OAUTH_TOKEN_SECRET'
)
```

For direct REST calls without the library:
```python
import httpx

BASE = "https://api.trello.com/1"
AUTH = {"key": API_KEY, "token": ACCESS_TOKEN}

# Example: get a card
resp = httpx.get(f"{BASE}/cards/{card_id}", params=AUTH)
```

---

## Key REST API Endpoints

### Boards

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get boards for member | GET | `/members/me/boards` |
| Get board | GET | `/boards/{id}` |
| Get lists on board | GET | `/boards/{id}/lists` |
| Get cards on board | GET | `/boards/{id}/cards` |

### Cards (Tasks)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get card | GET | `/cards/{id}` |
| Create card | POST | `/cards` |
| Update card | PUT | `/cards/{id}` |
| Delete card | DELETE | `/cards/{id}` |
| Move card to list | PUT | `/cards/{id}` (set `idList`) |

**Create card body**:
```json
{
  "name": "Card title",
  "desc": "Description",
  "idList": "LIST_ID",
  "pos": "bottom",
  "due": "2026-04-01T00:00:00.000Z"
}
```

**Update card body** (partial update supported):
```json
{
  "name": "Updated title",
  "idList": "NEW_LIST_ID",
  "closed": false
}
```

### Comments (Actions)

In Trello, comments are **actions** of type `commentCard`.

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get comments on card | GET | `/cards/{id}/actions?filter=commentCard` |
| Add comment | POST | `/cards/{id}/actions/comments` |
| Update comment | PUT | `/actions/{id}` |
| Delete comment | DELETE | `/actions/{id}` |

**Add comment body**:
```json
{
  "text": "Your comment here"
}
```

### Lists

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get list | GET | `/lists/{id}` |
| Get cards in list | GET | `/lists/{id}/cards` |
| Create list | POST | `/lists` |
| Update list | PUT | `/lists/{id}` |

---

## Webhooks

**Register webhook**: `POST /tokens/{token}/webhooks/`

```json
{
  "key": "YOUR_API_KEY",
  "callbackURL": "https://yourapp.com/webhooks/trello",
  "idModel": "BOARD_OR_CARD_ID",
  "description": "My webhook"
}
```

> Trello validates the `callbackURL` with a HEAD request during registration — your endpoint must return `200`.

**List webhooks for token**: `GET /tokens/{token}/webhooks/`  
**Delete webhook**: `DELETE /webhooks/{id}`

**Webhook payload**:
```json
{
  "action": {
    "id": "ACTION_ID",
    "idMemberCreator": "MEMBER_ID",
    "type": "updateCard",
    "date": "2026-03-21T10:00:00.000Z",
    "data": {
      "card": { "id": "CARD_ID", "name": "Card name", "idShort": 42 },
      "board": { "id": "BOARD_ID", "name": "Board name" },
      "listAfter": { "id": "LIST_ID", "name": "Done" },
      "listBefore": { "id": "LIST_ID", "name": "In Progress" }
    }
  },
  "model": { "id": "BOARD_ID", ... },
  "webhook": { "id": "WEBHOOK_ID", ... }
}
```

**Key action types**:
- `createCard` — card created
- `updateCard` — card moved, renamed, due date changed, etc.
- `deleteCard` — card deleted
- `commentCard` — comment added
- `updateComment` — comment edited
- `deleteComment` — comment deleted
- `addLabelToCard`, `removeLabelFromCard`
- `addMemberToCard`, `removeMemberFromCard`

**Signature verification**: Each request includes `X-Trello-Webhook` header — HMAC-SHA1 of `JSON.stringify(body) + callbackURL` using your app secret.

```python
import hmac, hashlib, base64

def verify_trello_webhook(body_bytes: bytes, callback_url: str, secret: str) -> bool:
    content = body_bytes + callback_url.encode()
    digest = hmac.new(secret.encode(), content, hashlib.sha1).digest()
    expected = base64.b64encode(digest).decode()
    return hmac.compare_digest(expected, request_header_value)
```

**Loop prevention**: Include `X-Trello-Client-Identifier` header on your API calls — Trello echoes it back in webhooks so you can skip processing your own changes.

**Retry policy**: 3 retries with 30s, 60s, 120s backoff. Webhook disabled after 30 days + 1000 consecutive failures.

**Webhook sources IP**: `104.192.142.240/28`

---

## Custom Fields

- Enable Custom Fields Power-Up on the board first
- `GET /boards/{id}/customFields` — list custom field definitions
- `GET /cards/{id}/customFieldItems` — get values for a card
- `PUT /cards/{id}/customField/{customFieldId}/item` — set a value

---

## Rate Limits

- **300 requests per 10 seconds** per token
- **100 requests per 10 seconds** per API key
- Returns `429` when exceeded

---

## Pagination

- Use `?limit=N` (max 1000) and `?before=ID` / `?since=ID` for cursor pagination
- Most list endpoints support `?fields=field1,field2` to reduce payload size

---

## Gotchas

- Webhooks belong to **tokens**, not apps — if the token is revoked, the webhook is deleted
- You can only watch objects the token has access to
- `idModel` can be a board, card, list, or member — board-level webhooks are most common
- Comments are actions, not a separate resource — always filter by `type=commentCard`
- Trello has no native "status" field — status is represented by which **list** a card is in
- Custom fields require the Power-Up to be enabled per board
- No refresh tokens — Trello tokens can be set to `expiration=never` during OAuth
- `callbackURL` must be HTTPS with a valid SSL cert (no self-signed)
