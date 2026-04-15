export interface AgentMeta {
  id: string;
  label: string;
  path: string;
  hint: string;
}

export interface CategoryMeta {
  label: string;
  description: string;
  agents: AgentMeta[];
}

export interface AgencyData {
  baseRepo: string;
  categories: Record<string, CategoryMeta>;
}

export type AgentLabelsEs = Record<string, string>;

export interface GenericFields {
  name: string;
  context: string;
  stack: string;
  refs: string;
  constraints: string;
}

export interface DesignFields {
  brand: string;
  goal: string;
  surfaces: string[];
  accessibility: string;
  deliverable: string;
}

export interface ProductFields {
  problem: string;
  goals: string;
  nonGoals: string;
  personas: string;
  stakeholders: string;
  horizon: string;
}
