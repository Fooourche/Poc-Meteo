from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.agents.client import ImageItem, run_agents
from app.agents.registry import list_agents
from app.models.schemas import AgentAnalysis, AgentInfo

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentInfo])
async def get_agents() -> list[AgentInfo]:
    return [
        AgentInfo(id=agent.id, name=agent.name, description=agent.description)
        for agent in list_agents()
    ]


@router.post("/analyze", response_model=list[AgentAnalysis])
async def analyze(
    agent_ids: str = Form(..., description="Identifiants d'agents separes par des virgules"),
    question: str = Form(""),
    weather_context: str | None = Form(None, description="Contexte meteo au format JSON"),
    images: list[UploadFile] = File(default=[]),
    labels: list[str] = Form(default=[]),
) -> list[AgentAnalysis]:
    ids = [agent_id.strip() for agent_id in agent_ids.split(",") if agent_id.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="Au moins un agent_id est requis")

    image_items: list[ImageItem] = []
    for i, image in enumerate(images):
        content = await image.read()
        if not content:
            continue
        label = labels[i] if i < len(labels) and labels[i] else f"Carte {i + 1}"
        image_items.append((content, image.content_type or "image/png", label))

    return await run_agents(
        agent_ids=ids,
        question=question,
        images=image_items,
        weather_context=weather_context,
    )
