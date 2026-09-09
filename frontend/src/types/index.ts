export interface AgentInfo {
  id: string;
  name: string;
  description: string;
}

export interface AgentAnalysis {
  agent_id: string;
  agent_name: string;
  analysis: string;
  error: string | null;
}

export interface WeatherCurrent {
  temperature_c: number;
  windspeed_kmh: number;
  winddirection_deg: number;
  weathercode: number;
  time: string;
}

export interface WeatherDaily {
  date: string;
  temperature_max_c: number;
  temperature_min_c: number;
  precipitation_sum_mm: number;
  weathercode: number;
}

export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  current: WeatherCurrent;
  daily: WeatherDaily[];
}

export interface EcmwfProductInfo {
  id: string;
  name: string;
  description: string;
}
