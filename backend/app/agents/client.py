import asyncio
import base64

from anthropic import AsyncAnthropic

from app.agents.registry import AgentDefinition, get_agent
from app.core.config import get_settings
from app.models.schemas import AgentAnalysis

MAX_TOKENS = 1024


def _client() -> AsyncAnthropic:
    settings = get_settings()
    return AsyncAnthropic(api_key=settings.anthropic_api_key)


async def _run_agent(
    agent: AgentDefinition,
    question: str,
    image_bytes: bytes | None,
    image_media_type: str | None,
    weather_context: str | None,
) -> AgentAnalysis:
    settings = get_settings()

    content: list[dict] = []
    if image_bytes is not None:
        content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_media_type or "image/png",
                    "data": base64.b64encode(image_bytes).decode("utf-8"),
                },
            }
        )
    if weather_context:
        content.append({"type": "text", "text": f"Donnees meteo (JSON) :\n{weather_context}"})
    content.append({"type": "text", "text": question or "Analyse cette carte/ces donnees meteo."})

    try:
        response = await _client().messages.create(
            model=settings.anthropic_model,
            max_tokens=MAX_TOKENS,
            system=agent.system_prompt,
            messages=[{"role": "user", "content": content}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        return AgentAnalysis(agent_id=agent.id, agent_name=agent.name, analysis=text)
    except Exception as exc:  # noqa: BLE001 - on veut afficher l'erreur cote agent, pas planter la requete
        return AgentAnalysis(agent_id=agent.id, agent_name=agent.name, analysis="", error=str(exc))


async def run_agents(
    agent_ids: list[str],
    question: str,
    image_bytes: bytes | None = None,
    image_media_type: str | None = None,
    weather_context: str | None = None,
) -> list[AgentAnalysis]:
    agents = [get_agent(agent_id) for agent_id in agent_ids]
    known_agents = [agent for agent in agents if agent is not None]

    tasks = [
        _run_agent(agent, question, image_bytes, image_media_type, weather_context)
        for agent in known_agents
    ]
    return list(await asyncio.gather(*tasks))
