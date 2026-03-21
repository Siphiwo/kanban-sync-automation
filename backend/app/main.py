from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import get_client
from app.routers import auth, platforms, sync_rules, sync_logs, webhooks
from app.routers import llm as llm_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure TTL index on oauth_states collection
    client = get_client()
    db = client.get_default_database()
    await db.oauth_states.create_index("expires_at", expireAfterSeconds=0)
    await db.sync_logs.create_index([("user_id", 1), ("created_at", -1)])
    await db.sync_logs.create_index([("payload_hash", 1), ("user_id", 1), ("created_at", -1)])
    await db.sync_rules.create_index([("user_id", 1), ("source_platform", 1), ("source_project_id", 1), ("is_active", 1)])
    yield
    client.close()


app = FastAPI(title="Smart Kanban Sync", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(platforms.router)
app.include_router(sync_rules.router)
app.include_router(webhooks.router)
app.include_router(sync_logs.router)
app.include_router(llm_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
