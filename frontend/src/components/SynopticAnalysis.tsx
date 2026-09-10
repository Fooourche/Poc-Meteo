import { useState } from "react";

import { fetchEcmwfChart } from "../api/client";
import { SYNOPTIC_PARAMETERS } from "../synopticProducts";

interface Props {
  onAddImage: (file: File, label: string) => void;
}

const STEP_HOURS = [0, 24, 48, 72, 96, 120, 144, 168];

// Les runs HRES ECMWF sont a 00Z et 12Z. On s'aligne sur le dernier run
// "rond" plutot qu'une heure arbitraire (reduit un motif frequent de 404 :
// base_time hors-run). Le run le plus recent peut ne pas etre encore
// publie (~6-9h de delai) : ajustez manuellement au champ si besoin.
function latestRunTime(): string {
  const date = new Date();
  const runHour = date.getUTCHours() >= 12 ? 12 : 0;
  date.setUTCHours(runHour, 0, 0, 0);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function addHours(isoString: string, hours: number): string {
  const date = new Date(isoString);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function SynopticAnalysis({ onAddImage }: Props) {
  const [parameterId, setParameterId] = useState(SYNOPTIC_PARAMETERS[0].id);
  const [product, setProduct] = useState(SYNOPTIC_PARAMETERS[0].product);
  const [level, setLevel] = useState(SYNOPTIC_PARAMETERS[0].level ?? "");
  const [label, setLabel] = useState(SYNOPTIC_PARAMETERS[0].label);
  const [baseTime, setBaseTime] = useState(latestRunTime());
  const [projection, setProjection] = useState("opencharts_central_europe");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handleParameterChange(id: string) {
    const preset = SYNOPTIC_PARAMETERS.find((candidate) => candidate.id === id);
    setParameterId(id);
    if (preset) {
      setProduct(preset.product);
      setLevel(preset.level ?? "");
      setLabel(preset.label);
    }
  }

  const currentPreset = SYNOPTIC_PARAMETERS.find((candidate) => candidate.id === parameterId);

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
          product,
          baseTime,
          validTime,
          projection,
          level: level || undefined,
        });
        const file = new File([blob], `${product}-J+${offset}h.png`, {
          type: blob.type || "image/png",
        });
        onAddImage(file, `${label} — J+${offset}h`);
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
      <h2>Analyse synoptique (ECMWF Open Charts)</h2>
      <p className="agent-description">
        Charge automatiquement les 8 echeances de J a J+7 (pas de 24h) pour le produit
        selectionne et les ajoute a la sequence de cartes ci-dessous, prete pour l'analyse par
        les agents.
      </p>

      <label>
        Parametre (pre-remplit produit/niveau, modifiables ci-dessous)
        <select value={parameterId} onChange={(e) => handleParameterChange(e.target.value)}>
          {SYNOPTIC_PARAMETERS.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.label}
            </option>
          ))}
        </select>
      </label>
      {currentPreset && <p className="agent-description">{currentPreset.description}</p>}

      <p className="agent-description">
        <strong>Identifiants non garantis</strong> : a verifier/corriger via le bouton
        "Download" d'une carte sur{" "}
        <a href="https://charts.ecmwf.int/" target="_blank" rel="noreferrer">
          charts.ecmwf.int
        </a>{" "}
        si une echeance echoue en 404.
      </p>

      <div className="coords-row">
        <label>
          Produit ECMWF
          <input value={product} onChange={(e) => setProduct(e.target.value)} />
        </label>
        <label>
          Niveau (hPa, optionnel)
          <input value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
      </div>

      <label>
        Libelle des cartes
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>

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
      <p className="agent-description">
        Les runs ECMWF sont a 00Z/12Z et publies avec quelques heures de delai. Si le run le
        plus recent echoue partout, essayez le run precedent (soustrayez 12h).
      </p>

      <button onClick={handleLoadWeek} disabled={loading || !product}>
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
