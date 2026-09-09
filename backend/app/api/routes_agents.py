from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.agents.client import run_agents
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
    image: UploadFile | None = None,
) -> list[AgentAnalysis]:
    ids = [agent_id.strip() for agent_id in agent_ids.split(",") if agent_id.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="Au moins un agent_id est requis")

    image_bytes: bytes | None = None
    image_media_type: str | None = None
    if image is not None:
        image_bytes = await image.read()
        image_media_type = image.content_type

    return await run_agents(
        agent_ids=ids,
        question=question,
        image_bytes=image_bytes,
        image_media_type=image_media_type,
        weather_context=weather_context,
    )
