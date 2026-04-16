import labelsRaw from "../../agentes/js/agent-labels-es.js?raw";
import type { AgentLabelsEs, AgentMeta } from "../types";

/** El JS generado puede llevar comentarios `//` antes de `window.…`; JSON.parse falla si el string empieza por `/`. */
function stripLeadingLineCommentsAndBom(raw: string): string {
  return raw.replace(/^\uFEFF/, "").replace(/^(?:\s*\/\/[^\n]*\r?\n)+/, "");
}

function parseAgentLabels(raw: string): AgentLabelsEs {
  const body = stripLeadingLineCommentsAndBom(raw);
  const json = body.replace(/^window\.AGENT_LABELS_ES\s*=\s*/, "").replace(/;\s*$/, "");
  return JSON.parse(json) as AgentLabelsEs;
}

export const agentLabelsEs = parseAgentLabels(labelsRaw);

export function agentDisplayName(agent: AgentMeta): string {
  return agentLabelsEs[agent.id] ?? agent.label;
}
