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
    assert "medium-mslp-wind850" in product_ids
