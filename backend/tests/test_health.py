from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_agents() -> None:
    response = client.get("/api/agents")
    assert response.status_code == 200
    agent_ids = {agent["id"] for agent in response.json()}
    assert {"previsionniste", "vigilance", "vulgarisateur"} <= agent_ids


def test_list_ecmwf_products() -> None:
    response = client.get("/api/ecmwf/products")
    assert response.status_code == 200
    product_ids = {product["id"] for product in response.json()}
    assert {"medium-mslp-wind850", "medium-z500-t850", "medium-mslp-rain"} <= product_ids


def test_analyze_with_multiple_images() -> None:
    tiny_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    response = client.post(
        "/api/agents/analyze",
        data={
            "agent_ids": "previsionniste",
            "question": "Decris l'evolution",
            "labels": ["T+0h", "T+24h"],
        },
        files=[
            ("images", ("t0.png", tiny_png, "image/png")),
            ("images", ("t24.png", tiny_png, "image/png")),
        ],
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["agent_id"] == "previsionniste"
    # Avec une cle API factice, l'appel Anthropic echoue mais l'erreur doit
    # etre capturee proprement (pas de crash de la requete HTTP).
    assert results[0]["error"] is not None


def test_analyze_without_images() -> None:
    response = client.post(
        "/api/agents/analyze",
        data={"agent_ids": "vulgarisateur", "question": "Que dire de la meteo ?"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
