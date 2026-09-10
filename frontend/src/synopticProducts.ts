export interface SynopticParameter {
  id: string;
  label: string;
  product: string;
  level?: string;
  description: string;
}

// Identifiants CONFIRMES manuellement par l'utilisateur le 2026-09-11,
// via le bouton "Download" de chaque carte reelle sur charts.ecmwf.int
// (contrairement aux versions precedentes de ce fichier, basees sur une
// mauvaise source et jamais verifiees). Restent modifiables dans l'UI si
// un identifiant se revele incorrect ou si un produit plus specifique
// est trouve plus tard (ex: pour "altitude").
export const SYNOPTIC_PARAMETERS: SynopticParameter[] = [
  {
    id: "z500",
    label: "Z500 + T850 (geopotentiel + temperature)",
    product: "medium-z500-t850",
    description:
      "Geopotentiel a 500 hPa et temperature a 850 hPa : lecture synoptique classique (ondes courtes/longues, advection thermique).",
  },
  {
    id: "surface",
    label: "Surface (pression + vent 850 hPa)",
    product: "medium-mslp-wind850",
    description:
      "Pression au niveau de la mer et vent a 850 hPa : anticyclones, depressions, fronts.",
  },
  {
    id: "altitude",
    label: "Altitude (geopotentiel + temperature)",
    product: "medium-z500-t850",
    description:
      "Meme produit que Z500/T850 pour l'instant : aucune carte dediee au courant-jet " +
      "(vent/tourbillon en altitude) n'a encore ete identifiee sur charts.ecmwf.int. A " +
      "remplacer si un produit plus specifique est trouve.",
  },
  {
    id: "precipitation",
    label: "Precipitation (pression + pluie)",
    product: "medium-mslp-rain",
    description: "Pression au niveau de la mer et precipitations.",
  },
  {
    id: "temperature",
    label: "Temperature",
    // A RECONFIRMER : indique comme identique a Z500/T850, ce qui est
    // physiquement surprenant pour une carte de temperature (2m attendue).
    // Verifier sur charts.ecmwf.int si un produit dedie existe (ex: 2t).
    product: "medium-z500-t850",
    description:
      "Produit a reconfirmer : identique a Z500/T850 d'apres la derniere verification, " +
      "ce qui semble etre une erreur - a corriger si un produit de temperature dedie existe.",
  },
];
