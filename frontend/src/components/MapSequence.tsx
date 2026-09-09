import type { MapItem } from "../types";

interface Props {
  items: MapItem[];
  onRemove: (id: string) => void;
  onRelabel: (id: string, label: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

export function MapSequence({ items, onRemove, onRelabel, onMove }: Props) {
  return (
    <div className="panel">
      <h2>Cartes a analyser {items.length > 0 && `(${items.length})`}</h2>
      <p className="agent-description">
        Toutes les cartes listees ici sont envoyees ensemble aux agents dans une seule requete :
        ils peuvent ainsi decrire une evolution temporelle (sequence) ou croiser plusieurs
        parametres (combinaison) au lieu de commenter chaque carte isolement. Renommez-les pour
        aider les agents (ex: "T+0h", "T+24h - pression", "Precipitations").
      </p>

      {items.length === 0 ? (
        <p className="agent-description">Aucune carte pour l'instant. Ajoutez-en via l'upload ou ECMWF Open Charts.</p>
      ) : (
        items.map((item, index) => (
          <div className="sequence-item" key={item.id}>
            <img src={item.previewUrl} alt={item.label} className="sequence-thumb" />
            <input
              className="sequence-label"
              value={item.label}
              onChange={(e) => onRelabel(item.id, e.target.value)}
              aria-label="Nom de la carte"
            />
            <div className="sequence-actions">
              <button onClick={() => onMove(item.id, -1)} disabled={index === 0} title="Monter">
                ↑
              </button>
              <button
                onClick={() => onMove(item.id, 1)}
                disabled={index === items.length - 1}
                title="Descendre"
              >
                ↓
              </button>
              <button onClick={() => onRemove(item.id)} title="Retirer">
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
