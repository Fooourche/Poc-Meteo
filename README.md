# POC Meteo - Analyse de cartes meteo par agents IA

Prototype organise autour d'un cadre d'expertise previsionniste a 4
etapes (observation, calage des modeles, analyse synoptique, comparaison
modeles/ensemble - voir `docs/ARCHITECTURE.md`), dont seule l'**analyse
synoptique** est implementee pour l'instant :

- Chargement automatique d'une semaine de cartes **ECMWF Open Charts**
  (J a J+7, pas de 24h) pour un parametre au choix (Z500, surface,
  altitude, precipitation, temperature), ajoutees directement a une
  sequence prete pour l'analyse.
- Sources additionnelles disponibles en complement : upload manuel
  d'images, recuperation ECMWF a la carte, donnees ponctuelles
  Open-Meteo (regroupees sous "Autres sources").
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
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── DEPLOY.md
└── render.yaml       # Blueprint de deploiement Render (backend + frontend)
```

Voir `docs/ARCHITECTURE.md` pour le detail des choix techniques,
`docs/ROADMAP.md` pour les prochaines etapes, et `docs/DEPLOY.md` pour
deployer gratuitement le prototype sur Render.

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

### Deploiement

Un Blueprint Render (`render.yaml`) est fourni pour deployer gratuitement
le backend et le frontend en quelques clics. Voir `docs/DEPLOY.md` pour
la procedure complete.

## Fonctionnement

1. Dans "Analyse synoptique", choisissez un parametre (Z500, surface,
   altitude, precipitation, temperature) et un "base time" (run de
   reference), puis cliquez "Charger la sequence J a J+7" : les 8
   echeances sont recuperees automatiquement et ajoutees a la sequence
   de cartes plus bas. Renommez ou reordonnez-les si besoin.
2. (Optionnel) Depuis "Autres sources", ajoutez une image uploadee, une
   carte ECMWF ponctuelle, ou des donnees meteo par coordonnees GPS.
3. Selectionnez un ou plusieurs agents IA (previsionniste, vigilance,
   vulgarisateur).
4. Posez une question libre et lancez l'analyse : toutes les cartes du
   panier sont envoyees ensemble a chaque agent selectionne, qui repond
   en tenant compte de l'evolution ou des correlations entre elles.

## Sequences et combinaisons de cartes

Le panier de cartes accepte deux usages avec la meme mecanique :

- **Sequence temporelle** : ajoutez la meme carte ECMWF a plusieurs
  echeances (`valid_time`) successives pour que les agents decrivent
  une evolution (ex: creusement d'une depression sur 72h).
- **Combinaison de parametres** : ajoutez plusieurs produits differents
  pour la meme echeance (ex: pression+vent et precipitations) pour que
  les agents croisent les informations.

Toutes les cartes du panier sont envoyees en une seule requete a Claude
(avec leur libelle), plutot qu'analysees separement : le modele peut
ainsi comparer directement les images entre elles.

## Analyse synoptique : produits ECMWF utilises

Les 5 parametres proposes dans "Analyse synoptique" pre-remplissent les
produits ECMWF Open Charts suivants - **identifiants non verifies contre
l'API reelle** (suppositions de nommage, a corriger au premier 404 via
les champs "Produit"/"Niveau" editables dans l'UI, en recuperant le vrai
identifiant sur [charts.ecmwf.int](https://charts.ecmwf.int/) bouton
"Download" d'une carte) :

| Parametre     | Produit                | Niveau |
|---------------|-------------------------|--------|
| Z500          | `medium-t-z`            | 500 hPa |
| Surface       | `medium-mslp-wind850`   | (integre au produit) |
| Altitude      | `medium-rv-div-uv`      | 700 hPa |
| Precipitation | `medium-rain-acc`       | - |
| Temperature   | `medium-2t-wind`        | - |

## Cartes ECMWF Open Charts

Le panneau "Carte ECMWF Open Charts" interroge l'API publique
`charts.ecmwf.int/opencharts-api/v1/` (aucune cle requise) pour recuperer
une image de prevision (ex: `medium-mslp-wind850` pour pression + vent).
Le nom exact d'un produit ou d'une projection s'obtient sur
[charts.ecmwf.int](https://charts.ecmwf.int/) via le bouton "Download"
d'une carte (documentation Swagger associee). Chaque carte recuperee est
ajoutee au panier de cartes, au meme titre qu'une image uploadee.

## Ajouter un nouvel agent

Editez `backend/app/agents/registry.py` et ajoutez une entree dans le
dictionnaire `AGENTS` avec un `id`, un `name`, une `description` et un
`system_prompt`. Aucune autre modification n'est necessaire : l'agent
apparait automatiquement dans la liste du frontend.
