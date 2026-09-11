"""Client pour l'API publique ECMWF Open Charts (charts.ecmwf.int).

Aucune cle API n'est requise. Le fonctionnement (verifie via le notebook
officiel ecmwf/notebook-examples/opencharts/Download_medium_range_product_example.ipynb,
qui utilise product='medium-uv-rh') est en deux temps :

1. GET {ECMWF_API_URL}products/{product}/?<parametres> renvoie un JSON dont
   la cle data.link.href contient l'URL reelle de l'image generee.
2. On telecharge cette image (PNG ou PDF).

Les identifiants marques "confirme" dans SUGGESTED_PRODUCTS ci-dessous
ont ete verifies manuellement par l'utilisateur via le bouton "Download"
d'une carte reelle sur https://charts.ecmwf.int/ (2026-09-11) ; les autres
restent des suppositions non confirmees (a ne pas confondre avec les
notebooks ecmwf/notebook-examples/opencharts/ du meme nom, qui recreent
des cartes a la main depuis des donnees brutes ecmwf-opendata - meme
nommage, API differente). L'identifiant de produit reste un champ libre
cote API : en cas de 404, le corriger directement dans l'UI.
"""

import re
from datetime import datetime, timezone

import httpx

from app.models.schemas import EcmwfProductInfo

ECMWF_API_URL = "https://charts.ecmwf.int/opencharts-api/v1/"

# Quand on n'indique ni base_time ni valid_time, l'API renvoie le dernier
# run disponible (verifie via le notebook officiel
# ecmwf/notebook-examples/opencharts/Explore_the_opencharts_API.ipynb).
# La description de la reponse contient un texte du type :
# "Base time: Wed 19 Oct 2022 00 UTC Valid time: Wed 19 Oct 2022 00 UTC (+0h) Area : Europe"
# d'ou l'on extrait le run reellement publie, plus fiable qu'une estimation
# a partir de l'horloge locale (les runs 00Z/12Z sont publies avec un delai
# variable).
_BASE_TIME_PATTERN = re.compile(r"Base time:\s*(.+?)\s+UTC\b")

SUGGESTED_PRODUCTS: list[EcmwfProductInfo] = [
    EcmwfProductInfo(
        id="medium-mslp-wind850",
        name="[confirme] Pression mer + vent 850 hPa",
        description="Pression au niveau de la mer et vent a 850 hPa (echeance medium range).",
    ),
    EcmwfProductInfo(
        id="medium-z500-t850",
        name="[confirme] Geopotentiel 500 hPa + temperature 850 hPa",
        description="Carte synoptique classique (Z500/T850) : ondes, advection thermique.",
    ),
    EcmwfProductInfo(
        id="medium-mslp-rain",
        name="[confirme] Pression mer + precipitations",
        description="Pression au niveau de la mer et precipitations.",
    ),
    EcmwfProductInfo(
        id="medium-2mt-wind30",
        name="[confirme] Temperature 2 m + vent",
        description="Temperature a 2 metres et vent.",
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


def _parse_base_time(description: str) -> str:
    match = _BASE_TIME_PATTERN.search(description)
    if not match:
        raise ValueError(f"Impossible d'extraire le 'Base time' de : {description!r}")
    parsed = datetime.strptime(match.group(1), "%a %d %b %Y %H").replace(tzinfo=timezone.utc)
    return parsed.strftime("%Y-%m-%dT%H:%M:%SZ")


async def get_latest_run_time(reference_product: str) -> str:
    """Interroge un produit sans base_time/valid_time pour connaitre le
    dernier run ECMWF reellement publie et disponible."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f"{ECMWF_API_URL}products/{reference_product}/")
        response.raise_for_status()
        data = response.json()

    description = data["data"]["attributes"]["description"]
    return _parse_base_time(description)
