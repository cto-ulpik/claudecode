import { agentDisplayName } from "../data/agentLabelsEs";
import { categoryLabelEs } from "../data/agencyData";
import type { AgentMeta, DesignFields, GenericFields, ProductFields } from "../types";

interface BuildBriefInput {
  categoryId: string;
  meta: AgentMeta;
  generic: GenericFields;
  design: DesignFields;
  product: ProductFields;
  contact: string;
}

export function buildBrief(input: BuildBriefInput): string {
  const { categoryId, meta, generic, design, product, contact } = input;

  const gName = generic.name.trim() || "_(sin título)_";
  const gContext = generic.context.trim() || "_(pendiente)_";
  const gStack = generic.stack.trim();
  const gRefs = generic.refs.trim();
  const gConstraints = generic.constraints.trim();
  const cleanContact = contact.trim();

  const lines: string[] = [];
  lines.push(`# Brief para agente: ${agentDisplayName(meta)}`);
  lines.push("");
  lines.push("**Repositorio**: https://github.com/msitarzewski/agency-agents");
  lines.push(`**Carpeta del repositorio**: \`${categoryId}/\` (${categoryLabelEs(categoryId)})`);
  lines.push(`**Archivo del agente especializado**: \`${meta.path}\``);
  lines.push("");
  lines.push("## Instrucción de activación");
  lines.push("");
  lines.push(
    `Activa el modo del agente **${agentDisplayName(meta)}** (repo: \`${meta.label}\`) según el markdown en \`${meta.path}\`. ` +
      "Respeta personalidad, reglas críticas y plantillas de entregables del archivo."
  );
  lines.push("");
  lines.push("## Contexto general");
  lines.push("");
  lines.push("### Solicitud / proyecto");
  lines.push(gName);
  lines.push("");
  lines.push("### Objetivo y alcance");
  lines.push(gContext);
  lines.push("");

  if (gStack) {
    lines.push("### Stack y restricciones técnicas");
    lines.push(gStack);
    lines.push("");
  }
  if (gRefs) {
    lines.push("### Enlaces y datos de entrada");
    lines.push(gRefs);
    lines.push("");
  }
  if (gConstraints) {
    lines.push("### Plazo, idioma, compliance");
    lines.push(gConstraints);
    lines.push("");
  }

  if (categoryId === "design") {
    const brand = design.brand.trim();
    const goal = design.goal.trim();
    const surfaces = design.surfaces.join(", ") || "Web";

    lines.push("## Parámetros adicionales · Diseño (UI Designer y afines)");
    lines.push("");
    if (brand) {
      lines.push("### Marca y tono");
      lines.push(brand);
      lines.push("");
    }
    if (goal) {
      lines.push("### Objetivo de diseño");
      lines.push(goal);
      lines.push("");
    }
    lines.push(`### Superficies: ${surfaces}`);
    lines.push(`### Accesibilidad: ${design.accessibility}`);
    lines.push(`### Salida esperada: ${design.deliverable}`);
    lines.push("");
  }

  if (categoryId === "product") {
    const problem = product.problem.trim();
    const goals = product.goals.trim();
    const nonGoals = product.nonGoals.trim();
    const personas = product.personas.trim();
    const stakeholders = product.stakeholders.trim();
    const horizon = product.horizon.trim();

    lines.push("## Parámetros adicionales · Producto (esqueleto PRD)");
    lines.push("");
    if (problem) {
      lines.push("### Problema / oportunidad y evidencia");
      lines.push(problem);
      lines.push("");
    }
    if (goals) {
      lines.push("### Metas y métricas");
      lines.push(goals);
      lines.push("");
    }
    if (nonGoals) {
      lines.push("### No objetivos");
      lines.push(nonGoals);
      lines.push("");
    }
    if (personas) {
      lines.push("### Personas e historias");
      lines.push(personas);
      lines.push("");
    }
    if (stakeholders) {
      lines.push("### Stakeholders");
      lines.push(stakeholders);
      lines.push("");
    }
    if (horizon) {
      lines.push("### Horizonte temporal");
      lines.push(horizon);
      lines.push("");
    }
  }

  if (cleanContact) {
    lines.push(`**Contacto**: ${cleanContact}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(`_Landing agency-agents · ${new Date().toISOString().slice(0, 10)}_`);

  return lines.join("\n");
}
