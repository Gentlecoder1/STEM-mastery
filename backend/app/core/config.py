from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="STEM_",
        extra="ignore",
    )

    app_name: str = "STEM Mastery API"
    version: str = "0.1.0"
    env: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["*"]

    # Neo4j AuraDB (authoritative for the curriculum graph). Read-only access is
    # expected: catalog queries never mutate the graph.
    neo4j_uri: str = ""
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # Supabase (authoritative for learner state: profiles, progress, mastery).
    # The service-role key is used server-side only for writes and must never be
    # exposed to the mobile app. JWKS is derived from ``supabase_url`` unless set.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwks_url: str = ""

    # SciBERT (semantic entity extraction). The model is lazy-loaded on the
    # first inference — never at startup, never on ordinary catalog requests.
    # Leave the path blank to disable the semantic endpoints (they then return
    # 503) while everything else keeps working. Resolved relative to the
    # backend project root, e.g. "models/stem_scibert_final".
    scibert_model_path: str = ""
    scibert_min_confidence: float = 0.80
    scibert_max_text_chars: int = 5000

    @property
    def resolved_jwks_url(self) -> str:
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return ""

    @property
    def supabase_issuer(self) -> str:
        if not self.supabase_url:
            return ""
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_rest_url(self) -> str:
        if not self.supabase_url:
            return ""
        return f"{self.supabase_url.rstrip('/')}/rest/v1"

    @property
    def resolved_scibert_model_path(self) -> Path:
        """Absolute SciBERT directory, relative to the backend project root.

        Anchored to this file (``.../backend/app/core/config.py``), never to the
        process working directory, so it also resolves under Vercel where the
        entrypoint is ``api/index.py``.
        """
        if not self.scibert_model_path:
            return Path()
        backend_root = Path(__file__).resolve().parents[2]
        return backend_root / self.scibert_model_path

    @property
    def scibert_model_name(self) -> str:
        """Short model identifier (e.g. "stem_scibert_final") or "". """
        return self.scibert_model_path.replace("\\", "/").strip("/").rstrip("/").split("/")[-1]


settings = Settings()
