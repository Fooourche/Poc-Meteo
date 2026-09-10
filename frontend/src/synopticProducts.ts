export interface SynopticParameter {
  id: string;
  label: string;
  product: string;
  level?: string;
  description: string;
}

// Identifiants de produits ECMWF Open Charts A CONFIRMER : ce sont des
// suppositions raisonnables (coherentes avec la nomenclature "medium-*"
// vue sur charts.ecmwf.int), mais PAS verifiees contre l'API reelle (les
// notebooks ecmwf/notebook-examples/opencharts/ portant des noms
// similaires retracent en fait des cartes a la main a partir de donnees
// brutes ecmwf-opendata, pas des appels a cette API). En cas de 404,
// corriger via le champ "Produit" de l'UI, en recuperant l'identifiant
// exact sur charts.ecmwf.int (bouton "Download" d'une carte).
export const SYNOPTIC_PARAMETERS: SynopticParameter[] = [
  {
    id: "z500",
    label: "Z500 (geopotentiel 500 hPa)",
    product: "medium-t-z",
    level: "500",
    description:
      "Geopotentiel et temperature a 500 hPa : lecture classique des ondes courtes/longues et de l'advection thermique.",
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
    label: "Altitude (tourbillon/divergence + vent 700 hPa)",
    product: "medium-rv-div-uv",
    level: "700",
    description:
      "Tourbillon relatif, divergence et vent a 700 hPa : creux, dorsales, zones de divergence en altitude.",
  },
  {
    id: "precipitation",
    label: "Precipitation (cumul)",
    product: "medium-rain-acc",
    description: "Cumul de precipitations depuis l'echeance initiale.",
  },
  {
    id: "temperature",
    label: "Temperature (2 m + vent 10 m)",
    product: "medium-2t-wind",
    description: "Temperature a 2 m et vent a 10 m.",
  },
];
