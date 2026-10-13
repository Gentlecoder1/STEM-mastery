from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="STEM_",
        extra="ignore",
    )

    app_name: str = "STEM Mastery API"
    version: str = "0.1.0"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["*"]


settings = Settings()
