from __future__ import annotations

import secrets
from typing import Optional

import bcrypt
from fastapi import Header, HTTPException, status

from . import db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def generate_api_key() -> str:
    return secrets.token_hex(24)


async def get_current_user(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> dict:
    if not x_api_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing X-API-Key header.")
    user = await db.users().find_one({"api_key": x_api_key})
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API key.")
    return user
