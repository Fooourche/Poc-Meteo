# POC Meteo - Analyse de cartes meteo par agents IA

Prototype permettant de :

- Uploader une carte meteo (radar, pression, satellite...) ou recuperer des
  donnees meteo via une API publique (Open-Meteo).
- Connecter un ou plusieurs **agents IA d'expertise meteo** (bases sur
  Claude, Anthropic API) pour analyser ces cartes/donnees et obtenir des
  points de vue complementaires (previsionniste, vigilance/risques,
  vulgarisation grand public).

## Structure du projet

```
Poc-Meteo/
├── backend/          # API FastAPI (Python)
│   ├── app/
│   │   ├── agents/   # Registre des agents IA + client Anthropic
│   │   ├── api/      # Routes HTTP
│   │   ├── core/     # Configuration
│   │   ├── models/   # Schemas Pydantic
│   │   └── services/ # Client API meteo (Open-Meteo)
│   └── tests/
├── frontend/         # Application React/TypeScript (Vite)
│   └── src/
│       ├── api/         # Client HTTP vers le backend
│       ├── components/  # UI (upload carte, meteo, agents, resultats)
│       └── types/
└── docs/
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

Voir `docs/ARCHITECTURE.md` pour le detail des choix techniques et
`docs/ROADMAP.md` pour les prochaines etapes.

## Demarrage rapide

### Pre-requis

- Python 3.11+
- Node.js 18+
- Une cle API Anthropic (https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis renseigner ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

L'API est alors disponible sur `http://localhost:8000` (doc interactive
sur `http://localhost:8000/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173` (le serveur Vite
proxy les appels `/api` vers le backend sur le port 8000).

## Fonctionnement

1. Uploadez une image de carte meteo et/ou recuperez des donnees meteo par
   coordonnees GPS.
2. Selectionnez un ou plusieurs agents IA (previsionniste, vigilance,
   vulgarisateur).
3. Posez une question libre et lancez l'analyse : chaque agent selectionne
   repond independamment, avec son propre angle d'expertise.

## Ajouter un nouvel agent

Editez `backend/app/agents/registry.py` et ajoutez une entree dans le
dictionnaire `AGENTS` avec un `id`, un `name`, une `description` et un
`system_prompt`. Aucune autre modification n'est necessaire : l'agent
apparait automatiquement dans la liste du frontend.
