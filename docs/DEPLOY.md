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
7. Une fois deployes, Render affiche les URLs (`https://poc-meteo-frontend.onrender.com`
   et `https://poc-meteo-backend.onrender.com` si les noms de
   `render.yaml` sont libres, sinon Render ajoute un suffixe). Ces URLs
   sont deja renseignees en dur dans `render.yaml` (`CORS_ORIGINS` cote
   backend, `VITE_API_BASE_URL` cote frontend) : si Render vous attribue
   des URLs differentes (suffixe ajoute), mettez a jour ces deux valeurs
   dans `render.yaml` et repoussez.
8. Ouvrir l'URL du frontend et tester : ajouter une carte, selectionner
   un agent, lancer une analyse. Le tout premier appel peut prendre
   jusqu'a une minute le temps que le backend (plan free) se reveille.

## Mettre a jour le deploiement

Chaque `git push` sur la branche configuree dans Render redeclenche
automatiquement un build + deploiement des deux services (comportement
par defaut de Render). Aucune action manuelle n'est necessaire.

## Depannage

- **"Failed to fetch" dans l'appli (ex: en recuperant une carte ECMWF ou
  la liste des agents)** : c'est le message generique du navigateur quand
  une requete est bloquee par CORS ou n'atteint pas le bon serveur.
  1. Verifier que `https://<votre-backend>.onrender.com/api/health`
     repond bien `{"status":"ok"}` dans le navigateur (sinon le backend
     est en panne ou encore en train de demarrer : re-essayer apres
     ~1 min).
  2. Visiter `https://<votre-backend>.onrender.com/api/debug/config` :
     `cors_origins_resolved` doit contenir l'URL complete et exacte du
     frontend (`https://poc-meteo-frontend.onrender.com`, avec le bon
     sous-domaine). **Piege constate en pratique** : la fonctionnalite
     `fromService` de Render (utilisee dans une version anterieure de
     `render.yaml` pour relier automatiquement les deux services) avec
     `property: host` renvoie le nom d'hote du **reseau prive interne**
     de Render (ex: juste `poc-meteo-frontend`), pas l'URL publique
     `https://poc-meteo-frontend.onrender.com` que le navigateur utilise
     reellement. La version actuelle de `render.yaml` fixe donc ces URLs
     en dur plutot que de se fier a `fromService`/`host`. Si vous avez
     renomme un service ou si Render lui a attribue un suffixe, mettez a
     jour `CORS_ORIGINS` et `VITE_API_BASE_URL` dans `render.yaml` en
     consequence.
  3. Cote frontend, `VITE_API_BASE_URL` est fige au moment du **build**
     (Vite) : changer sa valeur dans `render.yaml` ne suffit pas, il faut
     que le service `poc-meteo-frontend` rebuild reellement (un push qui
     modifie `render.yaml` devrait le declencher automatiquement ; sinon,
     forcer via le bouton **Manual Deploy** du service sur le dashboard).
- **Erreur au clic sur "Analyser"** : consulter les Logs du service
  `poc-meteo-backend` (cle Anthropic mal renseignee, credit insuffisant
  sur console.anthropic.com, etc.). L'erreur exacte de l'API Anthropic
  est aussi affichee directement dans l'interface, sous le nom de
  l'agent concerne.

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
