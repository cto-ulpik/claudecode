import labelsRaw from "../../agentes/js/agent-labels-es.js?raw";
import type { AgentLabelsEs, AgentMeta } from "../types";

function parseAgentLabels(raw: string): AgentLabelsEs {
  const json = raw.replace(/^window\.AGENT_LABELS_ES\s*=\s*/, "").replace(/;\s*$/, "");
  return JSON.parse(json) as AgentLabelsEs;
}

export const agentLabelsEs = parseAgentLabels(labelsRaw);

export function agentDisplayName(agent: AgentMeta): string {
  return agentLabelsEs[agent.id] ?? agent.label;
}
