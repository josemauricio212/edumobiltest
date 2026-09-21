from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "edu-rotas"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str
    database_echo: bool = False

    # Security / JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Sessão do painel web (JWT em cookie httpOnly)
    session_cookie_name: str = "edumobil_session"
    session_cookie_secure: bool = False

    # Roteirização
    osrm_base_url: str = "http://router.project-osrm.org"
    osrm_timeout_seconds: float = 20.0

    # Cria as tabelas no startup — conveniente em dev, desligue em produção
    # em favor das migrations do Alembic.
    auto_create_tables: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()