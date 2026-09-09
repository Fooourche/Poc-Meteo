import type { AgentInfo } from "../types";

interface Props {
  agents: AgentInfo[];
  selectedIds: string[];
  onToggle: (agentId: string) => void;
}

export function AgentSelector({ agents, selectedIds, onToggle }: Props) {
  return (
    <div className="panel">
      <h2>Agents IA d'expertise meteo</h2>
      <ul className="agent-list">
        {agents.map((agent) => (
          <li key={agent.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(agent.id)}
                onChange={() => onToggle(agent.id)}
              />
              <strong>{agent.name}</strong>
              <span className="agent-description">{agent.description}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
