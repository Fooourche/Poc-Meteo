# Deploiement sur Render (gratuit)

Ce projet inclut un `render.yaml` (Blueprint Render) qui deploie en une
fois les deux services :

- **poc-meteo-backend** : API FastAPI (plan free, s'endort apres 15 min
  d'inactivite, redemarre en ~1 min au prochain appel).
- **poc-meteo-frontend** : site statique React/Vite (plan free, CDN,
  toujours disponible, pas de cold start).

Cout d'infrastructure : **0 EUR/mois**. Seule la consommation de l'API
Anthropic (facturee au token par Anthropic, independamment de Render)
genere un cout, proportionnel a l'usage reel des agents.

## Pre-requis

- Un compte [Render](https://render.com/) (gratuit, pas de carte bancaire
  requise pour les plans free).
- Une cle API Anthropic (https://console.anthropic.com/).
- Le depot GitHub `Fooourche/Poc-Meteo` accessible depuis ce compte
  Render (Render demande une autorisation GitHub a la connexion).

## Etapes

1. Sur le tableau de bord Render, cliquer **New > Blueprint**.
2. Connecter le compte GitHub si ce n'est pas deja fait, puis
   selectionner le depot `Fooourche/Poc-Meteo`.
3. **Important** : ce depot n'a pas encore de branche `main`. Quand
   Render demande quelle branche utiliser, choisir explicitement
   `claude/weather-app-ai-agents-urziqw` (ou la branche que vous utilisez
   alors). Sans cette etape, Render risque de chercher une branche par
   defaut qui n'existe pas.
4. Render detecte automatiquement `render.yaml` a la racine et propose
   de creer les deux services (`poc-meteo-backend` et
   `poc-meteo-frontend`). Verifier que les deux apparaissent, puis
   valider.
5. Render demande la valeur des variables marquees `sync: false` dans
   `render.yaml`, c'est-a-dire **`ANTHROPIC_API_KEY`**. La renseigner
   avec votre cle Anthropic (elle reste secrete, jamais commitee dans le
   depot).
6. Cliquer **Apply** / **Create**. Render construit et deploie les deux
   services (quelques minutes pour le premier build).
7. Une fois deployes, Render affiche les URLs (ex:
   `https://poc-meteo-frontend.onrender.com` et
   `https://poc-meteo-backend.onrender.com`). `CORS_ORIGINS` (cote
   backend) et `VITE_API_BASE_URL` (cote frontend) sont deja relies
   automatiquement entre les deux services via `fromService` dans
   `render.yaml` : aucune configuration manuelle d'URL n'est necessaire.
8. Ouvrir l'URL du frontend et tester : ajouter une carte, selectionner
   un agent, lancer une analyse. Le tout premier appel peut prendre
   jusqu'a une minute le temps que le backend (plan free) se reveille.

## Mettre a jour le deploiement

Chaque `git push` sur la branche configuree dans Render redeclenche
automatiquement un build + deploiement des deux services (comportement
par defaut de Render). Aucune action manuelle n'est necessaire.

## Limites du plan gratuit et evolutions possibles

- **Cold start backend** : apres 15 min sans requete, le service web
  gratuit s'arrete et remet ~1 minute a redemarrer. Pour eliminer ce
  delai, passer le service `poc-meteo-backend` au plan payant le moins
  cher de Render (facture a partir de quelques dollars/mois pour un
  service "always-on") depuis son dashboard : aucune modification de
  code necessaire.
- **Pas d'authentification** : l'app deployee est accessible a quiconque
  a l'URL. Tant que le lien n'est pas partage largement, le risque
  principal est une consommation inattendue de credits Anthropic. Voir
  `docs/ROADMAP.md` (Etape 5) pour ajouter une protection minimale
  (mot de passe partage, par exemple) avant un partage plus large.
- **Variables d'environnement** : modifiables a tout moment depuis le
  dashboard Render de chaque service (onglet Environment), sans avoir a
  toucher au code ni a `render.yaml`.
