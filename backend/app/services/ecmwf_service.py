"""Client pour l'API publique ECMWF Open Charts (charts.ecmwf.int).

Aucune cle API n'est requise. Le fonctionnement (verifie via le notebook
officiel ecmwf/notebook-examples/opencharts) est en deux temps :

1. GET {ECMWF_API_URL}products/{product}/?<parametres> renvoie un JSON dont
   la cle data.link.href contient l'URL reelle de l'image generee.
2. On telecharge cette image (PNG ou PDF).

Le nom exact des produits et projections disponibles s'obtient sur le site
https://charts.ecmwf.int/ (bouton "Download" -> documentation Swagger).
SUGGESTED_PRODUCTS ci-dessous ne liste que quelques produits courants a
titre d'exemple ; l'identifiant de produit reste un champ libre cote API.
"""

import httpx

from app.models.schemas import EcmwfProductInfo

ECMWF_API_URL = "https://charts.ecmwf.int/opencharts-api/v1/"

SUGGESTED_PRODUCTS: list[EcmwfProductInfo] = [
    EcmwfProductInfo(
        id="medium-mslp-wind850",
        name="Pression mer + vent 850 hPa",
        description="Pression au niveau de la mer et vent a 850 hPa (echeance medium range).",
    ),
    EcmwfProductInfo(
        id="medium-uv-rh",
        name="Vent + humidite relative",
        description="Vent et humidite relative a un niveau de pression donne (medium range).",
    ),
    EcmwfProductInfo(
        id="medium-visibility",
        name="Visibilite",
        description="Carte de visibilite (medium range).",
    ),
    EcmwfProductInfo(
        id="opencharts_extended_meteogram",
        name="Meteogramme etendu",
        description="Evolution temporelle des parametres meteo pour un point donne.",
    ),
    # Produits utilises par le module "Analyse synoptique" du frontend
    # (voir frontend/src/synopticProducts.ts) ; ajoutes ici egalement pour
    # qu'ils apparaissent dans les suggestions du selecteur libre.
    EcmwfProductInfo(
        id="medium-t-z",
        name="Geopotentiel + temperature (Z500 avec level=500)",
        description="Geopotentiel et temperature a un niveau de pression donne.",
    ),
    EcmwfProductInfo(
        id="medium-rv-div-uv",
        name="Tourbillon/divergence + vent (avec level=700)",
        description="Tourbillon relatif, divergence et vent a un niveau de pression donne.",
    ),
    EcmwfProductInfo(
        id="medium-rain-acc",
        name="Precipitations (cumul)",
        description="Cumul de precipitations depuis l'echeance initiale.",
    ),
    EcmwfProductInfo(
        id="medium-2t-wind",
        name="Temperature 2m + vent 10m",
        description="Temperature a 2 metres et vent a 10 metres.",
    ),
]

_MEDIA_TYPES = {"png": "image/png", "pdf": "application/pdf"}


async def get_chart_image(
    product: str,
    base_time: str | None,
    valid_time: str | None,
    projection: str | None,
    level: str | None,
    image_format: str,
) -> tuple[bytes, str]:
    params: dict[str, str] = {"format": image_format}
    if base_time:
        params["base_time"] = base_time
    if valid_time:
        params["valid_time"] = valid_time
    if projection:
        params["projection"] = projection
    if level:
        params["level"] = level

    async with httpx.AsyncClient(timeout=20.0) as client:
        metadata_response = await client.get(f"{ECMWF_API_URL}products/{product}/", params=params)
        metadata_response.raise_for_status()
        data = metadata_response.json()
        image_url = data["data"]["link"]["href"]

        image_response = await client.get(image_url)
        image_response.raise_for_status()

    media_type = _MEDIA_TYPES.get(image_format, "image/png")
    return image_response.content, media_type
