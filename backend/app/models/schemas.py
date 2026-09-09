from pydantic import BaseModel, Field


class AgentInfo(BaseModel):
    id: str
    name: str
    description: str


class AgentAnalysis(BaseModel):
    agent_id: str
    agent_name: str
    analysis: str
    error: str | None = None


class AnalyzeResponse(BaseModel):
    results: list[AgentAnalysis]


class WeatherCurrent(BaseModel):
    temperature_c: float
    windspeed_kmh: float
    winddirection_deg: float
    weathercode: int
    time: str


class WeatherDaily(BaseModel):
    date: str
    temperature_max_c: float
    temperature_min_c: float
    precipitation_sum_mm: float
    weathercode: int


class WeatherForecastResponse(BaseModel):
    latitude: float
    longitude: float
    current: WeatherCurrent
    daily: list[WeatherDaily] = Field(default_factory=list)
