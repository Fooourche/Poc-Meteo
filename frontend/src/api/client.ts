import type { AgentAnalysis, AgentInfo, EcmwfProductInfo, WeatherForecastResponse } from "../types";

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

export async function fetchEcmwfProducts(): Promise<EcmwfProductInfo[]> {
  const response = await fetch("/api/ecmwf/products");
  return handle<EcmwfProductInfo[]>(response);
}

export interface EcmwfChartParams {
  product: string;
  baseTime?: string;
  validTime?: string;
  projection?: string;
  level?: string;
}

export async function fetchEcmwfChart(params: EcmwfChartParams): Promise<Blob> {
  const query = new URLSearchParams({ product: params.product });
  if (params.baseTime) query.set("base_time", params.baseTime);
  if (params.validTime) query.set("valid_time", params.validTime);
  if (params.projection) query.set("projection", params.projection);
  if (params.level) query.set("level", params.level);

  const response = await fetch(`/api/ecmwf/chart?${query.toString()}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API ECMWF (${response.status}): ${body}`);
  }
  return response.blob();
}
