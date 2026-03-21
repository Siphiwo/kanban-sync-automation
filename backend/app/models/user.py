from pydantic import BaseModel, Field
from typing import Any


class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    # platform -> {"access_token": encrypted, "refresh_token": encrypted|None, ...metadata}
    platforms: dict[str, dict[str, Any]] = {}

    model_config = {"populate_by_name": True}


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    connected_platforms: list[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
