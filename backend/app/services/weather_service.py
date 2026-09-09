"""Client pour l'API Open-Meteo (gratuite, sans cle API), utilisee pour
recuperer des donnees meteo structurees a partir de coordonnees GPS.
"""

import httpx

from app.models.schemas import WeatherCurrent, WeatherDaily, WeatherForecastResponse

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def get_forecast(latitude: float, longitude: float) -> WeatherForecastResponse:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current_weather": "true",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(OPEN_METEO_URL, params=params)
        response.raise_for_status()
        data = response.json()

    current_raw = data["current_weather"]
    current = WeatherCurrent(
        temperature_c=current_raw["temperature"],
        windspeed_kmh=current_raw["windspeed"],
        winddirection_deg=current_raw["winddirection"],
        weathercode=current_raw["weathercode"],
        time=current_raw["time"],
    )

    daily_raw = data.get("daily", {})
    daily = [
        WeatherDaily(
            date=date,
            temperature_max_c=daily_raw["temperature_2m_max"][i],
            temperature_min_c=daily_raw["temperature_2m_min"][i],
            precipitation_sum_mm=daily_raw["precipitation_sum"][i],
            weathercode=daily_raw["weathercode"][i],
        )
        for i, date in enumerate(daily_raw.get("time", []))
    ]

    return WeatherForecastResponse(
        latitude=data["latitude"],
        longitude=data["longitude"],
        current=current,
        daily=daily,
    )
