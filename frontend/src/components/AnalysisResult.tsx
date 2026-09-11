import ReactMarkdown from "react-markdown";

import type { AgentAnalysis } from "../types";

interface Props {
  results: AgentAnalysis[];
  loading: boolean;
}

export function AnalysisResult({ results, loading }: Props) {
  if (loading) {
    return (
      <div className="panel">
        <h2>Analyse des agents</h2>
        <p>Analyse en cours...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="panel">
      <h2>Analyse des agents</h2>
      {results.map((result) => (
        <article key={result.agent_id} className="agent-result">
          <h3>{result.agent_name}</h3>
          {result.error ? (
            <p className="error">Erreur : {result.error}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{result.analysis}</ReactMarkdown>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
