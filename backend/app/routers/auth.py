import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from requests_oauthlib import OAuth1Session

from app.core.config import settings
from app.core.database import get_database
from app.core.security import create_access_token, get_current_user
from app.models.user import TokenResponse, UserPublic
from app.services.token_store import delete_token, store_token

router = APIRouter(prefix="/auth", tags=["auth"])

Platform = Literal["asana", "trello", "monday", "jira", "linear"]

OAUTH2_CONFIGS: dict[str, dict] = {
    "asana": {
        "auth_url": "https://app.asana.com/-/oauth_authorize",
        "token_url": "https://app.asana.com/-/oauth_token",
        "scope": "default",
    },
    "monday": {
        "auth_url": "https://auth.monday.com/oauth2/authorize",
        "token_url": "https://auth.monday.com/oauth2/token",
        "scope": "boards:read boards:write updates:read updates:write webhooks:write users:read",
    },
    "jira": {
        "auth_url": "https://auth.atlassian.com/authorize",
        "token_url": "https://auth.atlassian.com/oauth/token",
        "scope": "read:jira-work write:jira-work read:jira-user offline_access",
    },
    "linear": {
        "auth_url": "https://linear.app/oauth/authorize",
        "token_url": "https://api.linear.app/oauth/token",
        "scope": "read write",
    },
}


def _redirect_uri(platform: str) -> str:
    return f"{settings.FRONTEND_URL}/auth/{platform}/callback"


def _backend_redirect_uri(platform: str) -> str:
    # Railway deployment: use the backend's own URL for the OAuth redirect
    # The backend handles the callback and then redirects to the frontend
    return f"{settings.FRONTEND_URL}/auth/{platform}/callback"


async def _save_state(db: AsyncIOMotorDatabase, state: str, platform: str) -> None:
    await db.oauth_states.insert_one({
        "_id": state,
        "platform": platform,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })


async def _consume_state(db: AsyncIOMotorDatabase, state: str, platform: str) -> bool:
    result = await db.oauth_states.find_one_and_delete({
        "_id": state,
        "platform": platform,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    return result is not None


async def _upsert_user(db: AsyncIOMotorDatabase, platform_user_id: str, email: str, name: str) -> str:
    """Create or update user by platform identity. Returns internal user _id."""
    user_id = f"user_{platform_user_id}"
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"email": email, "name": name}, "$setOnInsert": {"platforms": {}}},
        upsert=True,
    )
    return user_id


async def _fetch_user_identity(platform: str, access_token: str, extra: dict) -> tuple[str, str, str]:
    """Returns (platform_user_id, email, name)."""
    async with httpx.AsyncClient() as client:
        if platform == "asana":
            r = await client.get(
                "https://app.asana.com/api/1.0/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            r.raise_for_status()
            data = r.json()["data"]
            return data["gid"], data.get("email", ""), data.get("name", "")

        elif platform == "monday":
            r = await client.post(
                "https://api.monday.com/v2",
                json={"query": "{ me { id email name } }"},
                headers={"Authorization": f"Bearer {access_token}", "API-Version": "2025-04"},
            )
            r.raise_for_status()
            me = r.json()["data"]["me"]
            return str(me["id"]), me.get("email", ""), me.get("name", "")

        elif platform == "jira":
            r = await client.get(
                "https://api.atlassian.com/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            r.raise_for_status()
            data = r.json()
            return data["account_id"], data.get("email", ""), data.get("name", data.get("nickname", ""))

        elif platform == "linear":
            r = await client.post(
                "https://api.linear.app/graphql",
                json={"query": "{ viewer { id email name } }"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            r.raise_for_status()
            viewer = r.json()["data"]["viewer"]
            return viewer["id"], viewer.get("email", ""), viewer.get("name", "")

    raise ValueError(f"Unknown platform: {platform}")


# ── OAuth 2.0 connect ──────────────────────────────────────────────────────────

@router.get("/{platform}/connect")
async def oauth2_connect(
    platform: Platform,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    if platform == "trello":
        return await trello_connect(db)

    cfg = OAUTH2_CONFIGS[platform]
    state = secrets.token_urlsafe(32)
    await _save_state(db, state, platform)

    params: dict = {
        "client_id": getattr(settings, f"{platform.upper()}_CLIENT_ID"),
        "redirect_uri": _redirect_uri(platform),
        "response_type": "code",
        "state": state,
        "scope": cfg["scope"],
    }
    if platform == "jira":
        params["audience"] = "api.atlassian.com"
        params["prompt"] = "consent"

    return RedirectResponse(f"{cfg['auth_url']}?{urlencode(params)}")


# ── OAuth 2.0 callback ─────────────────────────────────────────────────────────

@router.get("/{platform}/callback")
async def oauth2_callback(
    platform: Platform,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    # OAuth 2.0 params
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    # Trello OAuth 1.0a params
    oauth_token: str | None = Query(default=None),
    oauth_verifier: str | None = Query(default=None),
):
    if platform == "trello":
        if not oauth_token or not oauth_verifier:
            raise HTTPException(status_code=400, detail="Missing Trello OAuth params")
        return await trello_callback(db, oauth_token=oauth_token, oauth_verifier=oauth_verifier)

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth params")

    if not await _consume_state(db, state, platform):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired state")

    cfg = OAUTH2_CONFIGS[platform]
    token_payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _redirect_uri(platform),
        "client_id": getattr(settings, f"{platform.upper()}_CLIENT_ID"),
        "client_secret": getattr(settings, f"{platform.upper()}_CLIENT_SECRET"),
    }

    async with httpx.AsyncClient() as client:
        if platform == "jira":
            r = await client.post(cfg["token_url"], json=token_payload)
        else:
            r = await client.post(cfg["token_url"], data=token_payload)
        r.raise_for_status()
        token_data = r.json()

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")
    expires_at = (
        (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
        if expires_in else None
    )

    extra: dict = {}

    # Jira: fetch cloud_id
    if platform == "jira":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.atlassian.com/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            r.raise_for_status()
            resources = r.json()
            if not resources:
                raise HTTPException(status_code=400, detail="No Jira sites accessible")
            extra["cloud_id"] = resources[0]["id"]

    platform_uid, email, name = await _fetch_user_identity(platform, access_token, extra)
    user_id = await _upsert_user(db, f"{platform}_{platform_uid}", email, name)

    await store_token(db, user_id, platform, {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": expires_at,
        **extra,
    })

    user = await db.users.find_one({"_id": user_id})
    jwt_token = create_access_token(user_id)

    return TokenResponse(
        access_token=jwt_token,
        user=UserPublic(
            id=user_id,
            email=user["email"],
            name=user["name"],
            connected_platforms=list(user.get("platforms", {}).keys()),
        ),
    )


# ── Trello OAuth 1.0a ──────────────────────────────────────────────────────────

async def trello_connect(db: AsyncIOMotorDatabase) -> RedirectResponse:
    oauth = OAuth1Session(
        settings.TRELLO_API_KEY,
        client_secret=settings.TRELLO_API_SECRET,
        callback_uri=_redirect_uri("trello"),
    )
    fetch_response = oauth.fetch_request_token("https://trello.com/1/OAuthGetRequestToken")
    request_token = fetch_response["oauth_token"]
    request_secret = fetch_response["oauth_token_secret"]

    # Store request secret keyed by request token (used in callback)
    await db.oauth_states.insert_one({
        "_id": f"trello_{request_token}",
        "secret": request_secret,
        "platform": "trello",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })

    auth_url = (
        f"https://trello.com/1/OAuthAuthorizeToken"
        f"?oauth_token={request_token}&scope=read,write&expiration=never"
    )
    return RedirectResponse(auth_url)


async def trello_callback(
    db: AsyncIOMotorDatabase,
    oauth_token: str,
    oauth_verifier: str,
) -> TokenResponse:
    state_doc = await db.oauth_states.find_one_and_delete({
        "_id": f"trello_{oauth_token}",
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired Trello OAuth state")

    oauth = OAuth1Session(
        settings.TRELLO_API_KEY,
        client_secret=settings.TRELLO_API_SECRET,
        resource_owner_key=oauth_token,
        resource_owner_secret=state_doc["secret"],
        verifier=oauth_verifier,
    )
    access_token_response = oauth.fetch_access_token("https://trello.com/1/OAuthGetAccessToken")
    access_token = access_token_response["oauth_token"]
    token_secret = access_token_response["oauth_token_secret"]

    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.trello.com/1/members/me",
            params={"key": settings.TRELLO_API_KEY, "token": access_token, "fields": "id,email,fullName"},
        )
        r.raise_for_status()
        me = r.json()

    user_id = await _upsert_user(db, f"trello_{me['id']}", me.get("email", ""), me.get("fullName", ""))
    await store_token(db, user_id, "trello", {"access_token": access_token, "token_secret": token_secret})

    user = await db.users.find_one({"_id": user_id})
    jwt_token = create_access_token(user_id)

    return TokenResponse(
        access_token=jwt_token,
        user=UserPublic(
            id=user_id,
            email=user["email"],
            name=user["name"],
            connected_platforms=list(user.get("platforms", {}).keys()),
        ),
    )


# ── Disconnect ─────────────────────────────────────────────────────────────────

@router.delete("/{platform}/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_platform(
    platform: Platform,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
):
    await delete_token(db, current_user["_id"], platform)


# ── Current user ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: Annotated[dict, Depends(get_current_user)]):
    return UserPublic(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        connected_platforms=list(current_user.get("platforms", {}).keys()),
    )
