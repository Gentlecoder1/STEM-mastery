"""Server-side writer for learner state in Supabase.

The mobile app is a read-only client for authoritative learner state; FastAPI
owns the writes (after grading) using the service-role key. All calls go through
the PostgREST HTTP API with ``httpx`` so no extra SDK is required and the
service-role secret never leaves the backend.
"""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class SupabaseNotConfiguredError(RuntimeError):
    """Raised when Supabase credentials are absent."""


class LearnerStateRepository:
    """Writes concept mastery, topic assessments, placement and lesson progress."""

    def __init__(self, base_url: str | None = None, service_role_key: str | None = None) -> None:
        rest_url = settings.supabase_rest_url
        self._base_url = (base_url if base_url is not None else rest_url).rstrip("/")
        key = settings.supabase_service_role_key
        self._key = service_role_key if service_role_key is not None else key

    @property
    def configured(self) -> bool:
        return bool(self._base_url and self._key)

    def _headers(self, prefer: str | None = None) -> dict[str, str]:
        if not self.configured:
            raise SupabaseNotConfiguredError("Supabase is not configured.")
        headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def _request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        url = f"{self._base_url}/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.request(
                method, url, params=params, json=json, headers=self._headers(prefer)
            )
        if response.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"Supabase {method} {table} failed: {response.text}",
                request=response.request,
                response=response,
            )
        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return None

    # -- concept mastery -----------------------------------------------------
    async def mark_concepts_completed(self, user_id: str, concept_ids: list[str]) -> None:
        """Insert completed concepts, ignoring duplicates (no extra XP)."""
        unique = sorted({cid for cid in concept_ids if cid})
        if not unique:
            return
        rows = [{"user_id": user_id, "concept_id": cid} for cid in unique]
        await self._request(
            "POST",
            "concept_progress",
            params={"on_conflict": "user_id,concept_id"},
            json=rows,
            prefer="resolution=ignore-duplicates,return=minimal",
        )

    # -- topic assessments ---------------------------------------------------
    async def upsert_topic_assessment(
        self, user_id: str, topic_id: str, score_pct: int, passed: bool
    ) -> None:
        await self._request(
            "POST",
            "topic_progress",
            params={"on_conflict": "user_id,topic_id"},
            json=[
                {
                    "user_id": user_id,
                    "topic_id": topic_id,
                    "score_pct": score_pct,
                    "passed": passed,
                }
            ],
            prefer="resolution=merge-duplicates,return=minimal",
        )

    # -- placement -----------------------------------------------------------
    async def save_placement(self, user_id: str, placement: dict[str, Any]) -> None:
        await self._request(
            "PATCH",
            "profiles",
            params={"id": f"eq.{user_id}"},
            json={"placement": placement},
            prefer="return=minimal",
        )

    # -- lesson reading progress --------------------------------------------
    async def load_lesson_progress(self, user_id: str) -> dict[str, dict[str, Any]]:
        rows = await self._request(
            "GET",
            "lesson_progress",
            params={"user_id": f"eq.{user_id}", "select": "*"},
        )
        if not isinstance(rows, list):
            return {}
        return {str(row.get("concept_id")): row for row in rows}

    async def upsert_lesson_progress(self, user_id: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        payload = [{**row, "user_id": user_id} for row in rows]
        await self._request(
            "POST",
            "lesson_progress",
            params={"on_conflict": "user_id,concept_id"},
            json=payload,
            prefer="resolution=merge-duplicates,return=minimal",
        )
