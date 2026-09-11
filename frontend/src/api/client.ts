import type {
  AgentAnalysis,
  AgentInfo,
  EcmwfProductInfo,
  MapItem,
  WeatherForecastResponse,
} from "../types";

// En local, VITE_API_BASE_URL est vide : le proxy Vite (vite.config.ts) redirige
// deja /api vers localhost:8000. En production, Render la renseigne (voir render.yaml).
function normalizeBaseUrl(value: string): string {
  if (!value) return "";
  const withScheme = value.startsWith("http") ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const response = await fetch(apiUrl("/api/agents"));
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
  const response = await fetch(apiUrl(`/api/weather/forecast?${params.toString()}`));
  return handle<WeatherForecastResponse>(response);
}

export interface AnalyzeParams {
  agentIds: string[];
  question: string;
  images: MapItem[];
  weatherContext?: string | null;
}

export async function analyzeWithAgents(params: AnalyzeParams): Promise<AgentAnalysis[]> {
  const formData = new FormData();
  formData.set("agent_ids", params.agentIds.join(","));
  formData.set("question", params.question);
  if (params.weatherContext) {
    formData.set("weather_context", params.weatherContext);
  }
  for (const item of params.images) {
    formData.append("images", item.file);
    formData.append("labels", item.label);
  }

  const response = await fetch(apiUrl("/api/agents/analyze"), {
    method: "POST",
    body: formData,
  });
  return handle<AgentAnalysis[]>(response);
}

export async function fetchEcmwfProducts(): Promise<EcmwfProductInfo[]> {
  const response = await fetch(apiUrl("/api/ecmwf/products"));
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

  const response = await fetch(apiUrl(`/api/ecmwf/chart?${query.toString()}`));
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API ECMWF (${response.status}): ${body}`);
  }
  return response.blob();
}

export async function fetchLatestEcmwfRun(referenceProduct?: string): Promise<string> {
  const query = referenceProduct
    ? `?reference_product=${encodeURIComponent(referenceProduct)}`
    : "";
  const response = await fetch(apiUrl(`/api/ecmwf/latest-run${query}`));
  const data = await handle<{ base_time: string }>(response);
  return data.base_time;
}
