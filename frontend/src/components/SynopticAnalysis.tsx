import { useState } from "react";

import { fetchEcmwfChart } from "../api/client";
import { SYNOPTIC_PARAMETERS } from "../synopticProducts";

interface Props {
  onAddImage: (file: File, label: string) => void;
}

const STEP_HOURS = [0, 24, 48, 72, 96, 120, 144, 168];

function isoAt(offsetHours: number): string {
  const date = new Date(Date.now() + offsetHours * 3600 * 1000);
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function addHours(isoString: string, hours: number): string {
  const date = new Date(isoString);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function SynopticAnalysis({ onAddImage }: Props) {
  const [parameterId, setParameterId] = useState(SYNOPTIC_PARAMETERS[0].id);
  const [baseTime, setBaseTime] = useState(isoAt(0));
  const [projection, setProjection] = useState("opencharts_central_europe");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const parameter =
    SYNOPTIC_PARAMETERS.find((candidate) => candidate.id === parameterId) ??
    SYNOPTIC_PARAMETERS[0];

  async function handleLoadWeek() {
    setLoading(true);
    setErrors([]);
    setProgress({ done: 0, total: STEP_HOURS.length });

    const failed: string[] = [];
    for (let i = 0; i < STEP_HOURS.length; i++) {
      const offset = STEP_HOURS[i];
      const validTime = addHours(baseTime, offset);
      try {
        const blob = await fetchEcmwfChart({
          product: parameter.product,
          baseTime,
          validTime,
          projection,
          level: parameter.level,
        });
        const file = new File([blob], `${parameter.id}-J+${offset}h.png`, {
          type: blob.type || "image/png",
        });
        onAddImage(file, `${parameter.label} — J+${offset}h`);
      } catch (err) {
        failed.push(`J+${offset}h : ${err instanceof Error ? err.message : "erreur inconnue"}`);
      }
      setProgress({ done: i + 1, total: STEP_HOURS.length });
    }

    setErrors(failed);
    setLoading(false);
  }

  return (
    <div className="panel">
      <h2>Analyse synoptique (ECMWF Open Data)</h2>
      <p className="agent-description">
        Charge automatiquement les 8 echeances de J a J+7 (pas de 24h) pour le parametre
        selectionne et les ajoute a la sequence de cartes ci-dessous, prete pour l'analyse par
        les agents.
      </p>

      <label>
        Parametre
        <select value={parameterId} onChange={(e) => setParameterId(e.target.value)}>
          {SYNOPTIC_PARAMETERS.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.label}
            </option>
          ))}
        </select>
      </label>
      <p className="agent-description">{parameter.description}</p>

      <div className="coords-row">
        <label>
          Base time (run, UTC)
          <input value={baseTime} onChange={(e) => setBaseTime(e.target.value)} />
        </label>
        <label>
          Projection
          <input value={projection} onChange={(e) => setProjection(e.target.value)} />
        </label>
      </div>

      <button onClick={handleLoadWeek} disabled={loading}>
        {loading && progress
          ? `Chargement... (${progress.done}/${progress.total})`
          : "Charger la sequence J a J+7"}
      </button>

      {errors.length > 0 && (
        <div className="error">
          <p>{errors.length} echeance(s) n'ont pas pu etre recuperees :</p>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
