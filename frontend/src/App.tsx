import { useEffect, useState } from "react";

import { analyzeWithAgents, fetchAgents } from "./api/client";
import { AgentSelector } from "./components/AgentSelector";
import { AnalysisResult } from "./components/AnalysisResult";
import { EcmwfChartPicker } from "./components/EcmwfChartPicker";
import { MapUploader } from "./components/MapUploader";
import { WeatherPanel } from "./components/WeatherPanel";
import type { AgentAnalysis, AgentInfo, WeatherForecastResponse } from "./types";

export default function App() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [question, setQuestion] = useState("Que peux-tu me dire sur cette situation meteo ?");
  const [results, setResults] = useState<AgentAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents()
      .then((fetched) => {
        setAgents(fetched);
        setSelectedAgentIds(fetched.length > 0 ? [fetched[0].id] : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"));
  }, []);

  function toggleAgent(agentId: string) {
    setSelectedAgentIds((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId],
    );
  }

  async function handleAnalyze() {
    if (selectedAgentIds.length === 0) {
      setError("Selectionnez au moins un agent.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeWithAgents({
        agentIds: selectedAgentIds,
        question,
        image,
        weatherContext: forecast ? JSON.stringify(forecast) : null,
      });
      setResults(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header>
        <h1>POC Meteo - Analyse par agents IA</h1>
        <p>Uploadez une carte meteo et/ou recuperez des donnees, puis interrogez un ou plusieurs agents.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="grid">
        <MapUploader onImageChange={setImage} />
        <EcmwfChartPicker onImageChange={setImage} />
        <WeatherPanel onForecastLoaded={setForecast} />
        <AgentSelector agents={agents} selectedIds={selectedAgentIds} onToggle={toggleAgent} />
      </section>

      <section className="panel">
        <h2>Question aux agents</h2>
        {image && <p className="agent-description">Image active pour l'analyse : {image.name}</p>}
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyse en cours..." : "Analyser"}
        </button>
      </section>

      <AnalysisResult results={results} loading={loading} />
    </main>
  );
}
