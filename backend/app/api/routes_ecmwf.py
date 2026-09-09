from fastapi import APIRouter, HTTPException, Query, Response

from app.models.schemas import EcmwfProductInfo
from app.services.ecmwf_service import SUGGESTED_PRODUCTS, get_chart_image

router = APIRouter(prefix="/api/ecmwf", tags=["ecmwf"])


@router.get("/products", response_model=list[EcmwfProductInfo])
async def list_products() -> list[EcmwfProductInfo]:
    return SUGGESTED_PRODUCTS


@router.get("/chart")
async def chart(
    product: str = Query(..., description="Identifiant du produit ECMWF Open Charts"),
    base_time: str | None = Query(None, description="Date de base ISO8601 (ex: 2026-09-09T00:00:00Z)"),
    valid_time: str | None = Query(None, description="Date d'echeance ISO8601"),
    projection: str | None = Query(None, description="Projection (ex: opencharts_central_europe)"),
    level: str | None = Query(None, description="Niveau de pression en hPa, si applicable"),
    image_format: str = Query("png", alias="format"),
) -> Response:
    try:
        content, media_type = await get_chart_image(
            product=product,
            base_time=base_time,
            valid_time=valid_time,
            projection=projection,
            level=level,
            image_format=image_format,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Erreur API ECMWF Open Charts: {exc}") from exc
    return Response(content=content, media_type=media_type)
