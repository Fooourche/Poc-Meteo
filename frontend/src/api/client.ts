import type { AgentAnalysis, AgentInfo, WeatherForecastResponse } from "../types";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const response = await fetch("/api/agents");
  return handle<AgentInfo[]>(response);
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
): Promise<WeatherForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  const response = await fetch(`/api/weather/forecast?${params.toString()}`);
  return handle<WeatherForecastResponse>(response);
}

export interface AnalyzeParams {
  agentIds: string[];
  question: string;
  image?: File | null;
  weatherContext?: string | null;
}

export async function analyzeWithAgents(params: AnalyzeParams): Promise<AgentAnalysis[]> {
  const formData = new FormData();
  formData.set("agent_ids", params.agentIds.join(","));
  formData.set("question", params.question);
  if (params.weatherContext) {
    formData.set("weather_context", params.weatherContext);
  }
  if (params.image) {
    formData.set("image", params.image);
  }

  const response = await fetch("/api/agents/analyze", {
    method: "POST",
    body: formData,
  });
  return handle<AgentAnalysis[]>(response);
}
