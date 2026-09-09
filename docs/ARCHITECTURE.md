# Architecture

## Vue d'ensemble

```
frontend (React/TS, Vite)  <-->  backend (FastAPI)  <-->  Anthropic API (Claude, vision)
                                        |
                                        +--> Open-Meteo API (donnees meteo)
                                        |
                                        +--> ECMWF Open Charts API (cartes meteo)
```

Le frontend ne parle jamais directement a Anthropic, Open-Meteo ou ECMWF :
tout transite par le backend, qui est le seul a detenir la cle API
Anthropic (Open-Meteo et ECMWF Open Charts sont publiques, sans cle).

## Backend (`backend/`)

- `app/main.py` : point d'entree FastAPI, CORS, montage des routers.
- `app/core/config.py` : configuration (variables d'environnement via
  pydantic-settings).
- `app/models/schemas.py` : modeles Pydantic partages (requetes/reponses API).
- `app/agents/registry.py` : **registre des agents IA d'expertise meteo**.
  Chaque agent = un system prompt specialise (previsionniste, vigilance,
  vulgarisateur...). Ajouter un agent = ajouter une entree ici.
- `app/agents/client.py` : appelle l'API Anthropic (Claude) pour chaque
  agent selectionne, en parallele (`asyncio.gather`). Supporte l'envoi
  d'une image (carte meteo, vision) et/ou d'un contexte texte (donnees
  meteo JSON).
- `app/services/weather_service.py` : client pour l'API Open-Meteo
  (gratuite, sans cle) pour recuperer meteo courante + previsions.
- `app/services/ecmwf_service.py` : client pour l'API publique **ECMWF
  Open Charts** (`charts.ecmwf.int/opencharts-api/v1/`). Recupere l'URL
  de l'image generee pour un produit/echeance/projection donnes, puis
  telecharge l'image (PNG/PDF).
- `app/api/routes_agents.py` : `GET /api/agents` (liste), `POST
  /api/agents/analyze` (upload image + selection agents + question).
- `app/api/routes_weather.py` : `GET /api/weather/forecast?latitude=&longitude=`.
- `app/api/routes_ecmwf.py` : `GET /api/ecmwf/products` (suggestions),
  `GET /api/ecmwf/chart?product=&base_time=&valid_time=&projection=&level=`
  (proxy image, evite le CORS et garde l'appel externe cote backend).

## Frontend (`frontend/`)

- `src/components/MapUploader.tsx` : upload manuel d'une image de carte
  meteo.
- `src/components/EcmwfChartPicker.tsx` : recuperation d'une carte
  directement depuis ECMWF Open Charts (produit, echeance, projection).
  Ecrit dans le meme etat `image` que `MapUploader` : les deux sources
  sont interchangeables du point de vue des agents.
- `src/components/WeatherPanel.tsx` : recuperation de donnees meteo par
  coordonnees GPS (via le backend, qui appelle Open-Meteo).
- `src/components/AgentSelector.tsx` : selection d'un ou plusieurs agents
  IA a interroger.
- `src/components/AnalysisResult.tsx` : affichage cote-a-cote des reponses
  de chaque agent selectionne.
- `src/api/client.ts` : appels HTTP vers le backend.

## Multi-agents

Le prototype permet de selectionner **plusieurs agents simultanement** :
chaque agent recoit la meme image/contexte meteo mais avec son propre
system prompt, et repond independamment. Les reponses sont affichees
en parallele pour comparaison (ex: le previsionniste donne une analyse
technique pendant que le vulgarisateur donne une explication simple).

Evolution possible : un agent "orchestrateur" qui route automatiquement
vers le bon expert selon la question, ou qui synthetise les reponses des
autres agents (voir ROADMAP.md).

## Choix techniques

- **FastAPI** : leger, async natif (utile pour appeler plusieurs agents
  en parallele), bon ecosysteme Python pour evoluer vers du traitement
  d'image scientifique (OpenCV, xarray, cartopy...) si besoin plus tard.
- **Open-Meteo** : API meteo gratuite sans cle API, ideale pour un
  prototype. Remplacable par Meteo-France, OpenWeatherMap, etc.
- **ECMWF Open Charts** : cartes meteo officielles du CEPMMT (pression,
  vent, visibilite, meteogrammes...), gratuites et sans cle API. Bonne
  source de cartes "reelles" pour tester les agents au-dela des uploads
  manuels. Verifier les conditions d'utilisation sur charts.ecmwf.int
  avant un usage en production (attribution, volumetrie).
- **Claude (Anthropic API)** : modele multimodal capable d'analyser une
  image de carte meteo directement, sans pipeline de vision separe.
