# Architecture

## Cadre d'expertise previsionniste

L'interface s'organise autour de 4 etapes inspirees d'un processus reel
d'expertise meteo (voir `StepNav.tsx`) :

1. **Observation** (a venir)
2. **Calage des modeles** - comparaison satellite/radar (a venir)
3. **Analyse synoptique** - implementee : chargement automatique d'une
   semaine de cartes ECMWF (J a J+7) pour un parametre synoptique donne.
4. **Comparaison modeles / ensemble** (a venir)

Seule l'etape 3 est fonctionnelle pour l'instant ; les autres apparaissent
dans la navigation comme reperes visuels du cadre cible, marquees
"bientot". Voir ROADMAP.md pour leur contenu prevu.

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
  d'une **liste de cartes labellisees** (0..N images, chacune avec un
  libelle du type "T+0h", "T+24h", "Precipitations") et/ou d'un contexte
  texte (donnees meteo JSON). Quand plusieurs images sont fournies, une
  instruction est ajoutee au message pour que l'agent raisonne sur
  l'ensemble (evolution temporelle ou correlation entre parametres)
  plutot que de commenter chaque image isolement.
- `app/services/weather_service.py` : client pour l'API Open-Meteo
  (gratuite, sans cle) pour recuperer meteo courante + previsions.
- `app/services/ecmwf_service.py` : client pour l'API publique **ECMWF
  Open Charts** (`charts.ecmwf.int/opencharts-api/v1/`). Recupere l'URL
  de l'image generee pour un produit/echeance/projection donnes, puis
  telecharge l'image (PNG/PDF).
- `app/api/routes_agents.py` : `GET /api/agents` (liste), `POST
  /api/agents/analyze` (0..N fichiers `images[]` + `labels[]` associes,
  selection agents, question, contexte meteo optionnel).
- `app/api/routes_weather.py` : `GET /api/weather/forecast?latitude=&longitude=`.
- `app/api/routes_ecmwf.py` : `GET /api/ecmwf/products` (suggestions),
  `GET /api/ecmwf/chart?product=&base_time=&valid_time=&projection=&level=`
  (proxy image, evite le CORS et garde l'appel externe cote backend).

## Frontend (`frontend/`)

- `src/components/StepNav.tsx` : bandeau visuel des 4 etapes du cadre
  d'expertise (voir plus haut), purement informatif pour l'instant.
- `src/components/SynopticAnalysis.tsx` : outil principal de l'etape
  "Analyse synoptique". L'utilisateur choisit un parametre (Z500,
  surface, altitude, precipitation, temperature - voir
  `src/synopticProducts.ts` pour le mapping vers les produits ECMWF Open
  Charts, verifies via les notebooks officiels ecmwf/notebook-examples)
  et un "base time" (run de reference). Un seul clic recupere les 8
  echeances J, J+24h, ..., J+168h et les ajoute toutes a la sequence de
  cartes, sans manipulation manuelle repetee.
- `src/components/MapUploader.tsx` : upload manuel d'une ou plusieurs
  images de carte meteo en une fois (regroupe avec `EcmwfChartPicker` et
  `WeatherPanel` sous "Autres sources", repliees par defaut).
- `src/components/EcmwfChartPicker.tsx` : recuperation d'une carte
  depuis ECMWF Open Charts (produit, echeance, projection). Chaque clic
  sur "Ajouter a la sequence" ajoute une carte supplementaire (ex:
  plusieurs echeances du meme produit, ou plusieurs produits pour la
  meme echeance).
- `src/components/MapSequence.tsx` : **panier de cartes** partage par
  `MapUploader` et `EcmwfChartPicker`. Affiche la liste des cartes
  accumulees (vignette + libelle editable), permet de les renommer, les
  reordonner (monter/descendre) ou les retirer avant analyse.
- `src/components/WeatherPanel.tsx` : recuperation de donnees meteo par
  coordonnees GPS (via le backend, qui appelle Open-Meteo).
- `src/components/AgentSelector.tsx` : selection d'un ou plusieurs agents
  IA a interroger.
- `src/components/AnalysisResult.tsx` : affichage cote-a-cote des reponses
  de chaque agent selectionne.
- `src/api/client.ts` : appels HTTP vers le backend.

## Sequences et combinaisons de cartes

Plutot que d'analyser les cartes une par une, le frontend construit une
**liste ordonnee et labellisee** de cartes (`MapItem[]`) alimentee par
l'upload et/ou ECMWF Open Charts. Toute la liste est envoyee en une
seule requete a `/api/agents/analyze` : cote backend, `agents/client.py`
place chaque image dans le message Claude precedee de son libelle, et
ajoute une instruction explicite d'analyse conjointe des qu'il y a plus
d'une carte. Cela couvre deux usages avec la meme mecanique :

- **Sequence temporelle** : plusieurs echeances du meme produit (ex:
  "T+0h", "T+24h", "T+48h") pour decrire une evolution.
- **Combinaison de parametres** : plusieurs produits pour la meme
  echeance (ex: "Pression + vent", "Precipitations") pour croiser les
  informations.

On aurait pu a la place composer une seule image fusionnee (montage/
overlay) cote backend, mais cela demanderait un alignement geographique
precis des cartes source et perdrait l'information semantique de chaque
couche. Laisser Claude raisonner sur plusieurs images labellisees est
plus robuste pour un prototype (voir ROADMAP.md pour une eventuelle
composition d'image reelle si un besoin visuel specifique apparait).

## Multi-agents

Le prototype permet de selectionner **plusieurs agents simultanement** :
chaque agent recoit le meme ensemble de cartes/contexte meteo mais avec
son propre system prompt, et repond independamment. Les reponses sont
affichees en parallele pour comparaison (ex: le previsionniste donne une
analyse technique pendant que le vulgarisateur donne une explication
simple).

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
