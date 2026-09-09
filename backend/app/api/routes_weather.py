from fastapi import APIRouter, HTTPException

from app.models.schemas import WeatherForecastResponse
from app.services.weather_service import get_forecast

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/forecast", response_model=WeatherForecastResponse)
async def forecast(latitude: float, longitude: float) -> WeatherForecastResponse:
    try:
        return await get_forecast(latitude, longitude)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Erreur API meteo: {exc}") from exc
