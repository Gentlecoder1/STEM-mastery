"""Supabase JWT authentication for learner-state endpoints.

Access tokens issued by Supabase use asymmetric signing (JWKS). We verify the
token signature against the project's JWKS endpoint and derive the learner
identity from the token's ``sub`` claim. Request-supplied identity is never
trusted.
"""

from __future__ import annotations

from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError
from pydantic import BaseModel, Field

from app.core.config import settings

# Supabase signs with RS256 by default; ES256 is accepted for key rotations.
_ALGORITHMS = ["RS256", "ES256"]


class CurrentUser(BaseModel):
    """The authenticated learner derived from a verified Supabase token."""

    user_id: str
    email: str | None = None
    claims: dict[str, Any] = Field(default_factory=dict)


_jwks_client: PyJWKClient | None = None
_jwks_url: str | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_url
    url = settings.resolved_jwks_url
    if _jwks_client is None or _jwks_url != url:
        _jwks_client = PyJWKClient(url, cache_keys=True, lifespan=300)
        _jwks_url = url
    return _jwks_client


async def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency that verifies the bearer token and returns the user."""
    if not settings.resolved_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured.",
        )

    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = token.strip()
    try:
        signing_key = await run_in_threadpool(
            _get_jwks_client().get_signing_key_from_jwt, token
        )
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=_ALGORITHMS,
            audience="authenticated",
            issuer=settings.supabase_issuer or None,
            options={"verify_iss": bool(settings.supabase_issuer)},
        )
    except PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    subject = claims.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing a subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(user_id=str(subject), email=claims.get("email"), claims=claims)


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
