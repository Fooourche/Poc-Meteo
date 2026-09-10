# Roadmap

## Etape 0 - Structure du projet (fait)

- Backend FastAPI (routes agents + meteo, registre d'agents extensible).
- Frontend React/TS (upload image, recuperation meteo, selection agents,
  affichage des analyses).
- Documentation (architecture, roadmap).
- Source de cartes supplementaire : ECMWF Open Charts (API publique,
  sans cle), en complement de l'upload manuel.
- Analyse par **sequence/combinaison de cartes** : le panier `MapItem[]`
  regroupe plusieurs cartes labellisees (upload multiple + ajouts
  successifs ECMWF) envoyees en une seule requete aux agents, qui
  raisonnent sur l'ensemble plutot que carte par carte.

## Etape 1bis - Deploiement (fait)

- Blueprint Render (`render.yaml`) : backend FastAPI + frontend statique,
  plan free des deux cotes (0 EUR/mois d'infra). Voir `docs/DEPLOY.md`
  pour la procedure de deploiement.
- URL d'API frontend rendue configurable (`VITE_API_BASE_URL`) pour
  fonctionner aussi bien en local (proxy Vite) qu'en production.

## Etape 1ter - Cadre d'expertise previsionniste (en cours)

L'app se structure autour de 4 etapes inspirees d'un vrai processus
d'expertise meteo (voir `docs/ARCHITECTURE.md`) :

1. **Observation** - a faire. Prevu : afficher/uploader des observations
   recentes (satellite, radar, stations) pour l'etat initial.
2. **Calage des modeles** (comparaison satellite/radar) - a faire. Prevu :
   comparer visuellement une sortie de modele a une observation reelle
   au meme instant, pour juger de la qualite de l'initialisation.
3. **Analyse synoptique** (fait) - `SynopticAnalysis.tsx` charge
   automatiquement les 8 echeances J a J+7 (pas de 24h) d'un parametre
   ECMWF Open Charts au choix (Z500, surface, altitude, precipitation,
   temperature - voir `frontend/src/synopticProducts.ts`), et les ajoute
   directement a la sequence de cartes pour analyse par les agents.
4. **Comparaison modeles / ensemble** - a faire. Prevu : comparer
   plusieurs modeles (ex: HRES vs ENS, ou ECMWF vs un autre centre) et/ou
   visualiser la dispersion d'ensemble (mean-spread, probabilite).

## Etape 1 - Faire tourner le prototype en local

1. `cd backend && python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. Copier `.env.example` en `.env` et renseigner `ANTHROPIC_API_KEY`.
4. `uvicorn app.main:app --reload --port 8000`
5. `cd frontend && npm install && npm run dev`
6. Ouvrir `http://localhost:5173`, tester avec une image de carte meteo
   (radar/pression/satellite) et/ou des coordonnees GPS.

## Etape 2 - Fiabiliser l'analyse d'images

- Ajouter une compression/redimensionnement cote frontend avant upload
  (limiter la taille des images envoyees a l'API).
- Gerer les formats non supportes / erreurs de l'API Anthropic proprement
  cote UI (deja partiellement fait via le champ `error` par agent).
- Ajouter des tests avec de vraies cartes meteo (radar Meteo-France,
  cartes de pression, images satellite) pour calibrer les system prompts.
- Limiter le nombre/poids total des cartes envoyees dans une sequence
  (taille de requete, cout et latence API croissent avec le nombre
  d'images) ; avertir l'utilisateur au-dela d'un seuil raisonnable
  (ex: 6-8 cartes).
- Explorer, si un besoin visuel precis apparait, une composition d'image
  reelle cote backend (montage/overlay aligne georeferencement) en
  complement de l'envoi de plusieurs images labellisees a Claude.

## Etape 3 - Enrichir les agents

- Ajouter des agents specialises supplementaires (ex: agro-meteorologue,
  meteo marine, meteo montagne) dans `app/agents/registry.py`.
- Ajouter un mode "synthese" : un agent orchestrateur qui lit les reponses
  des autres agents et produit une synthese unique.
- Permettre un historique de conversation par agent (suivi de contexte
  multi-tours), pas seulement une analyse ponctuelle.

## Etape 4 - Donnees meteo plus riches

- Integrer des cartes generees a partir de donnees (ex: carte de
  temperature/precipitations rendue en interne a partir d'Open-Meteo ou
  d'un autre fournisseur), en plus des images uploadees.
- Ajouter la persistance des analyses passees (base de donnees) pour
  comparer des previsions dans le temps.
- Explorer l'integration de donnees radar/satellite reelles (ex: API
  Meteo-France ouvertes si disponibles).
- Identifiants de produits ECMWF Open Charts confirmes le 2026-09-11 via
  le site (bouton "Download" d'une carte reelle) : `medium-z500-t850`
  (Z500+T850, aussi utilise pour "altitude" faute de mieux),
  `medium-mslp-wind850` (surface), `medium-mslp-rain` (precipitation),
  `medium-2mt-wind30` (temperature 2m + vent). Reste a trouver, si
  possible : un produit dedie pour "altitude" (courant-jet,
  vent/tourbillon) distinct de Z500.
- Etape "Calage des modeles" : integrer une source d'images satellite
  et/ou radar reelles (ex: EUMETSAT, Meteo-France) pour comparaison
  visuelle avec les sorties de modele.
- Etape "Comparaison modeles / ensemble" : ajouter les produits ECMWF
  Open Charts de type "mean-spread" et "probability" (deja repertories
  dans les notebooks officiels, ex: `medium-2t-mean-spread`,
  `medium-tp-probability`) au meme mecanisme de chargement automatique
  que `SynopticAnalysis`.

## Etape 5 - Durcissement produit

- Protection d'acces minimale (mot de passe partage ou authentification)
  avant un partage plus large du lien Render, deploye sans authentification
  pour l'instant.
- Gestion des couts API (cache des reponses, limites de taux, monitoring
  des tokens consommes par agent).
- Passer le backend Render au plan payant si le cold start (free tier)
  devient genant a l'usage.
- Tests end-to-end (upload -> analyse -> affichage).
