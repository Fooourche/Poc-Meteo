from app.core.config import Settings


def test_cors_origins_adds_missing_scheme() -> None:
    settings = Settings(cors_origins="poc-meteo-frontend.onrender.com")
    assert settings.cors_origins_list == ["https://poc-meteo-frontend.onrender.com"]


def test_cors_origins_keeps_existing_scheme() -> None:
    settings = Settings(cors_origins="http://localhost:5173,https://example.com")
    assert settings.cors_origins_list == ["http://localhost:5173", "https://example.com"]


def test_cors_origins_ignores_blank_entries() -> None:
    settings = Settings(cors_origins=" https://a.com , , https://b.com ")
    assert settings.cors_origins_list == ["https://a.com", "https://b.com"]
