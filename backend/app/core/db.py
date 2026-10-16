"""Neo4j AuraDB access for the FastAPI backend.

The graph is the authoritative source for the curriculum (subjects, topics,
concepts, content, questions) and for adaptive learner state (mastery,
attempts). Catalog code must never mutate it, so all reads go through the
read-only ``execute_read`` transaction function and a read-only database user
is expected in production.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession

from app.core.config import settings


class Neo4jDatabase:
    """Thin async wrapper around the Neo4j driver."""

    def __init__(self, uri: str, user: str, password: str, database: str) -> None:
        self._driver: AsyncDriver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        self._database = database

    @property
    def database(self) -> str:
        return self._database

    async def verify_connectivity(self) -> None:
        await self._driver.verify_connectivity()

    async def close(self) -> None:
        await self._driver.close()

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self._driver.session(database=self._database) as session:
            yield session


def create_database() -> Neo4jDatabase | None:
    """Build the database wrapper, or ``None`` when Neo4j is not configured.

    Returning ``None`` keeps the API bootable (and the test suite DB-free) while
    no credentials are present; dependent endpoints respond with 503.
    """
    if not settings.neo4j_uri:
        return None
    return Neo4jDatabase(
        settings.neo4j_uri,
        settings.neo4j_user,
        settings.neo4j_password,
        settings.neo4j_database,
    )
