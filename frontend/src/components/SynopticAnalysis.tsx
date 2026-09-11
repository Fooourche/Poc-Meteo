import { useEffect, useState } from "react";

import { fetchEcmwfChart, fetchLatestEcmwfRun } from "../api/client";
import { SYNOPTIC_PARAMETERS } from "../synopticProducts";

interface Props {
  onAddImage: (file: File, label: string) => void;
}

const STEP_HOURS = [0, 24, 48, 72, 96, 120, 144, 168];

type RunStatus = "detecting" | "detected" | "failed" | "manual";

// Estimation de secours (horloge locale) si la detection automatique
// echoue : les runs HRES ECMWF sont a 00Z et 12Z, on s'aligne sur le
// dernier run "rond". Peut etre en avance sur le run reellement publie
// (delai de quelques heures) : d'ou la detection automatique ci-dessous,
// plus fiable.
function fallbackRunTime(): string {
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
  const [selectedIds, setSelectedIds] = useState<string[]>(
    SYNOPTIC_PARAMETERS.map((param) => param.id),
  );
  const [baseTime, setBaseTime] = useState(fallbackRunTime());
  const [runStatus, setRunStatus] = useState<RunStatus>("detecting");
  const [projection, setProjection] = useState("opencharts_central_europe");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function detectLatestRun() {
    setRunStatus("detecting");
    try {
      const detected = await fetchLatestEcmwfRun();
      setBaseTime(detected);
      setRunStatus("detected");
    } catch {
      setRunStatus("failed");
    }
  }

  useEffect(() => {
    detectLatestRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleParameter(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((candidate) => candidate !== id) : [...current, id],
    );
  }

  async function handleLoadWeek() {
    const params = SYNOPTIC_PARAMETERS.filter((candidate) => selectedIds.includes(candidate.id));
    if (params.length === 0) return;

    setLoading(true);
    setErrors([]);
    const total = STEP_HOURS.length * params.length;
    setProgress({ done: 0, total });

    const failed: string[] = [];
    let done = 0;

    // Boucle par echeance d'abord (J+0, J+24h, ...) puis par champ : les
    // cartes d'un meme instant se retrouvent groupees dans la sequence,
    // pratique pour croiser plusieurs champs a la meme echeance.
    for (const offset of STEP_HOURS) {
      const validTime = addHours(baseTime, offset);
      const results = await Promise.allSettled(
        params.map(async (param) => {
          const blob = await fetchEcmwfChart({
            product: param.product,
            baseTime,
            validTime,
            projection,
            level: param.level,
          });
          const file = new File([blob], `${param.id}-J+${offset}h.png`, {
            type: blob.type || "image/png",
          });
          onAddImage(file, `${param.label} — J+${offset}h`);
        }),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const message =
            result.reason instanceof Error ? result.reason.message : "erreur inconnue";
          failed.push(`${params[index].label} — J+${offset}h : ${message}`);
        }
      });

      done += params.length;
      setProgress({ done, total });
    }

    setErrors(failed);
    setLoading(false);
  }

  return (
    <div className="panel">
      <h2>Analyse synoptique (ECMWF Open Charts)</h2>
      <p className="agent-description">
        Cochez un ou plusieurs champs a croiser, puis chargez automatiquement les 8 echeances de
        J a J+7 (pas de 24h) pour chacun. Les cartes sont ajoutees a la sequence ci-dessous,
        groupees par echeance, pretes pour l'analyse par les agents.
      </p>

      <ul className="agent-list">
        {SYNOPTIC_PARAMETERS.map((param) => (
          <li key={param.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(param.id)}
                onChange={() => toggleParameter(param.id)}
              />
              <strong>{param.label}</strong>
              <span className="agent-description">{param.description}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="coords-row">
        <label>
          Base time (run, UTC)
          <input
            value={baseTime}
            onChange={(e) => {
              setBaseTime(e.target.value);
              setRunStatus("manual");
            }}
          />
        </label>
        <label>
          Projection
          <input value={projection} onChange={(e) => setProjection(e.target.value)} />
        </label>
      </div>

      <p className="agent-description">
        {runStatus === "detecting" && "Detection du dernier run ECMWF publie..."}
        {runStatus === "detected" &&
          "Run detecte automatiquement aupres d'ECMWF (le plus recent reellement publie)."}
        {runStatus === "failed" &&
          "Detection automatique indisponible : estimation via l'horloge locale (00Z/12Z), a corriger manuellement si besoin."}
        {runStatus === "manual" && "Base time modifiee manuellement."}{" "}
        <button
          type="button"
          onClick={detectLatestRun}
          disabled={runStatus === "detecting"}
          className="link-button"
        >
          Redetecter le dernier run
        </button>
      </p>
      <p className="agent-description">
        Pour corriger un identifiant de produit errone, utilisez "Autres sources &gt; Carte
        ECMWF Open Charts".
      </p>

      <button onClick={handleLoadWeek} disabled={loading || selectedIds.length === 0}>
        {loading && progress
          ? `Chargement... (${progress.done}/${progress.total})`
          : `Charger la sequence J a J+7 (${selectedIds.length} champ${selectedIds.length > 1 ? "s" : ""})`}
      </button>

      {errors.length > 0 && (
        <div className="error">
          <p>{errors.length} carte(s) n'ont pas pu etre recuperees :</p>
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
