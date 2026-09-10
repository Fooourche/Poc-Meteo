from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_agents import router as agents_router
from app.api.routes_ecmwf import router as ecmwf_router
from app.api.routes_weather import router as weather_router
from app.core.config import get_settings

app = FastAPI(title="POC Meteo - API", version="0.1.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(weather_router)
app.include_router(ecmwf_router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/debug/config")
async def debug_config() -> dict[str, object]:
    """Endpoint temporaire pour diagnostiquer la config CORS en production
    sans avoir a fouiller le dashboard Render. A retirer une fois le
    deploiement stabilise (voir docs/DEPLOY.md)."""
    return {
        "cors_origins_raw": settings.cors_origins,
        "cors_origins_resolved": settings.cors_origins_list,
    }
