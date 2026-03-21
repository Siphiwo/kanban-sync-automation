from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from cryptography.fernet import Fernet
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings

_fernet = Fernet(settings.FERNET_KEY.encode() if isinstance(settings.FERNET_KEY, str) else settings.FERNET_KEY)

# Platforms that support token refresh
REFRESHABLE = {"asana", "monday", "jira", "linear"}

REFRESH_URLS = {
    "asana": "https://app.asana.com/-/oauth_token",
    "monday": "https://auth.monday.com/oauth2/token",
    "jira": "https://auth.atlassian.com/oauth/token",
    "linear": "https://api.linear.app/oauth/token",
}


def _encrypt(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def _decrypt(value: str) -> str:
    return _fernet.decrypt(value.encode()).decode()


async def store_token(db: AsyncIOMotorDatabase, user_id: str, platform: str, token_data: dict[str, Any]) -> None:
    encrypted: dict[str, Any] = {}
    for key in ("access_token", "refresh_token", "token_secret"):
        if token_data.get(key):
            encrypted[key] = _encrypt(token_data[key])
    for key in ("expires_at", "cloud_id", "scope"):
        if token_data.get(key) is not None:
            encrypted[key] = token_data[key]

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {f"platforms.{platform}": encrypted}},
    )


async def get_token(db: AsyncIOMotorDatabase, user_id: str, platform: str) -> dict[str, Any] | None:
    user = await db.users.find_one({"_id": user_id}, {f"platforms.{platform}": 1})
    if not user:
        return None
    platform_data = user.get("platforms", {}).get(platform)
    if not platform_data:
        return None

    result: dict[str, Any] = {}
    for key in ("access_token", "refresh_token", "token_secret"):
        if platform_data.get(key):
            result[key] = _decrypt(platform_data[key])
    for key in ("expires_at", "cloud_id", "scope"):
        if platform_data.get(key) is not None:
            result[key] = platform_data[key]
    return result


async def get_valid_access_token(db: AsyncIOMotorDatabase, user_id: str, platform: str) -> str | None:
    token_data = await get_token(db, user_id, platform)
    if not token_data:
        return None

    access_token = token_data.get("access_token")
    if not access_token:
        return None

    if platform not in REFRESHABLE:
        return access_token

    expires_at = token_data.get("expires_at")
    if expires_at:
        expiry = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < expiry - timedelta(minutes=5):
            return access_token

    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        return access_token

    refreshed = await _refresh_token(platform, refresh_token)
    if not refreshed:
        return access_token

    await store_token(db, user_id, platform, refreshed)
    return refreshed["access_token"]


async def _refresh_token(platform: str, refresh_token: str) -> dict[str, Any] | None:
    url = REFRESH_URLS[platform]
    client_id = getattr(settings, f"{platform.upper()}_CLIENT_ID")
    client_secret = getattr(settings, f"{platform.upper()}_CLIENT_SECRET")

    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload if platform == "jira" else None, data=payload if platform != "jira" else None)
        if resp.status_code != 200:
            return None
        data = resp.json()

    expires_in = data.get("expires_in")
    expires_at = (
        (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
        if expires_in else None
    )

    return {
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token", refresh_token),
        "expires_at": expires_at,
    }


async def delete_token(db: AsyncIOMotorDatabase, user_id: str, platform: str) -> None:
    await db.users.update_one(
        {"_id": user_id},
        {"$unset": {f"platforms.{platform}": ""}},
    )
