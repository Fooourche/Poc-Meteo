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
- Etendre la liste des produits ECMWF Open Charts suggeres (registre
  `SUGGESTED_PRODUCTS`) une fois les identifiants exacts verifies pour
  chaque type de carte utile (precipitations, temperature, neige...).

## Etape 5 - Durcissement produit

- Authentification utilisateur si le produit devient multi-utilisateurs.
- Gestion des couts API (cache des reponses, limites de taux, monitoring
  des tokens consommes par agent).
- Deploiement (conteneurisation backend + build frontend statique).
- Tests end-to-end (upload -> analyse -> affichage).
