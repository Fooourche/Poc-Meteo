import { useState } from "react";

import { fetchForecast } from "../api/client";
import type { WeatherForecastResponse } from "../types";

interface Props {
  onForecastLoaded: (forecast: WeatherForecastResponse | null) => void;
}

export function WeatherPanel({ onForecastLoaded }: Props) {
  const [latitude, setLatitude] = useState("48.8566");
  const [longitude, setLongitude] = useState("2.3522");
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecast(parseFloat(latitude), parseFloat(longitude));
      setForecast(result);
      onForecastLoaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      onForecastLoaded(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Donnees meteo (API)</h2>
      <div className="coords-row">
        <label>
          Latitude
          <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        </label>
        <label>
          Longitude
          <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </label>
        <button onClick={handleFetch} disabled={loading}>
          {loading ? "Chargement..." : "Recuperer"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {forecast && (
        <div className="weather-summary">
          <p>
            Actuellement : {forecast.current.temperature_c} degC, vent{" "}
            {forecast.current.windspeed_kmh} km/h
          </p>
          <ul>
            {forecast.daily.slice(0, 5).map((day) => (
              <li key={day.date}>
                {day.date} : {day.temperature_min_c}degC / {day.temperature_max_c}degC,{" "}
                {day.precipitation_sum_mm} mm
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
