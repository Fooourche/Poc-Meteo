from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        # Render (fromService/host) peut fournir un nom d'hote sans schema ;
        # sans "https://", la comparaison avec l'en-tete Origin du navigateur
        # ne matche jamais et CORS bloque tout (vu cote client comme un
        # generique "Failed to fetch").
        origins = []
        for origin in self.cors_origins.split(","):
            origin = origin.strip()
            if not origin:
                continue
            if not origin.startswith("http"):
                origin = f"https://{origin}"
            origins.append(origin)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
