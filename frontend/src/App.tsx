import { useEffect, useState } from "react";

import { analyzeWithAgents, fetchAgents } from "./api/client";
import { AgentSelector } from "./components/AgentSelector";
import { AnalysisResult } from "./components/AnalysisResult";
import { EcmwfChartPicker } from "./components/EcmwfChartPicker";
import { MapSequence } from "./components/MapSequence";
import { MapUploader } from "./components/MapUploader";
import { WeatherPanel } from "./components/WeatherPanel";
import type { AgentAnalysis, AgentInfo, MapItem, WeatherForecastResponse } from "./types";

function createMapItem(file: File, label: string): MapItem {
  return {
    id: crypto.randomUUID(),
    label,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export default function App() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
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

  function handleAddImages(files: File[]) {
    setMapItems((current) => [
      ...current,
      ...files.map((file) => createMapItem(file, file.name.replace(/\.[^./]+$/, ""))),
    ]);
  }

  function handleAddSingleImage(file: File, label: string) {
    setMapItems((current) => [...current, createMapItem(file, label)]);
  }

  function handleRemoveMapItem(id: string) {
    setMapItems((current) => current.filter((item) => item.id !== id));
  }

  function handleRelabelMapItem(id: string, label: string) {
    setMapItems((current) => current.map((item) => (item.id === id ? { ...item, label } : item)));
  }

  function handleMoveMapItem(id: string, direction: -1 | 1) {
    setMapItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
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
        images: mapItems,
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
        <p>
          Constituez une sequence ou une combinaison de cartes meteo, puis interrogez un ou
          plusieurs agents.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="grid">
        <MapUploader onAddImages={handleAddImages} />
        <EcmwfChartPicker onAddImage={handleAddSingleImage} />
        <WeatherPanel onForecastLoaded={setForecast} />
        <AgentSelector agents={agents} selectedIds={selectedAgentIds} onToggle={toggleAgent} />
      </section>

      <MapSequence
        items={mapItems}
        onRemove={handleRemoveMapItem}
        onRelabel={handleRelabelMapItem}
        onMove={handleMoveMapItem}
      />

      <section className="panel">
        <h2>Question aux agents</h2>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyse en cours..." : "Analyser"}
        </button>
      </section>

      <AnalysisResult results={results} loading={loading} />
    </main>
  );
}
