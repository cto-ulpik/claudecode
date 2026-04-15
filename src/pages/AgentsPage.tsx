import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { agentDisplayName } from "../data/agentLabelsEs";
import { CATEGORY_ORDER, agencyData, categoryLabelEs } from "../data/agencyData";
import { buildBrief } from "../lib/brief";
import type { AgentMeta, DesignFields, GenericFields, ProductFields } from "../types";
import "../../agentes/css/styles.css";

const DESIGN_ACCESSIBILITY_DEFAULT = "WCAG AA (recomendado en agentes UI)";
const DESIGN_DELIVERABLE_DEFAULT = "Sistema de diseño / tokens y componentes";

const INITIAL_GENERIC: GenericFields = {
  name: "",
  context: "",
  stack: "",
  refs: "",
  constraints: "",
};

const INITIAL_DESIGN: DesignFields = {
  brand: "",
  goal: "",
  surfaces: ["Web"],
  accessibility: DESIGN_ACCESSIBILITY_DEFAULT,
  deliverable: DESIGN_DELIVERABLE_DEFAULT,
};

const INITIAL_PRODUCT: ProductFields = {
  problem: "",
  goals: "",
  nonGoals: "",
  personas: "",
  stakeholders: "",
  horizon: "",
};

export function AgentsPage() {
  const defaultCategory = CATEGORY_ORDER.find((id) => agencyData.categories[id]) ?? Object.keys(agencyData.categories)[0] ?? "";

  const [categoryId, setCategoryId] = useState(defaultCategory);
  const [filterText, setFilterText] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [generic, setGeneric] = useState<GenericFields>(INITIAL_GENERIC);
  const [design, setDesign] = useState<DesignFields>(INITIAL_DESIGN);
  const [product, setProduct] = useState<ProductFields>(INITIAL_PRODUCT);
  const [contact, setContact] = useState("");
  const [briefText, setBriefText] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copiar");

  const categoryMeta = agencyData.categories[categoryId];
  const agentsInCategory = categoryMeta?.agents ?? [];

  const filteredAgents = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return agentsInCategory;
    return agentsInCategory.filter((agent) => {
      const translated = agentDisplayName(agent).toLowerCase();
      return (
        translated.includes(q) ||
        agent.label.toLowerCase().includes(q) ||
        agent.id.toLowerCase().includes(q) ||
        agent.path.toLowerCase().includes(q)
      );
    });
  }, [agentsInCategory, filterText]);

  useEffect(() => {
    setSelectedAgentId(filteredAgents[0]?.id ?? "");
  }, [categoryId, filteredAgents]);

  const selectedMeta: AgentMeta | undefined = filteredAgents.find((agent) => agent.id === selectedAgentId);
  const selectedFromCategory: AgentMeta | undefined = agentsInCategory.find((agent) => agent.id === selectedAgentId);
  const selectedAgent = selectedMeta ?? selectedFromCategory;
  const githubHref = selectedAgent ? `${agencyData.baseRepo}${selectedAgent.path}` : "#";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedAgent) return;
    setBriefText(
      buildBrief({
        categoryId,
        meta: selectedAgent,
        generic,
        design,
        product,
        contact,
      })
    );
  }

  function onReset() {
    setFilterText("");
    setCategoryId(defaultCategory);
    setSelectedAgentId(agencyData.categories[defaultCategory]?.agents[0]?.id ?? "");
    setGeneric(INITIAL_GENERIC);
    setDesign(INITIAL_DESIGN);
    setProduct(INITIAL_PRODUCT);
    setContact("");
    setBriefText("");
    setCopyLabel("Copiar");
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(briefText);
      setCopyLabel("Copiado");
    } catch {
      setCopyLabel("Error");
    }
    window.setTimeout(() => setCopyLabel("Copiar"), 2000);
  }

  const showDesignFields = categoryId === "design";
  const showProductFields = categoryId === "product";

  return (
    <div className="page">
      <p className="home-link">
        <Link to="/">← Inicio</Link>
      </p>

      <header className="hero">
        <p className="hero__tag">Basado en The Agency · open source</p>
        <h1 className="hero__title">
          <a href="https://github.com/msitarzewski/agency-agents" target="_blank" rel="noopener noreferrer">
            Agency Agents
          </a>
        </h1>
        <p className="hero__lede">
          Elige la <strong>carpeta del repositorio</strong> (<code>engineering/</code>, <code>design/</code>, <code>marketing/</code>,
          <code>product/</code>, etc.), el <strong>agente especializado</strong> y los parametros. El brief generado sirve para Claude
          Code, Cursor, Copilot y el resto de integraciones del proyecto.
        </p>
      </header>

      <form className="form-card" onSubmit={onSubmit} onReset={onReset}>
        <div className="field">
          <label htmlFor="category">Carpeta del repositorio</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {CATEGORY_ORDER.filter((id) => agencyData.categories[id]).map((id) => (
              <option key={id} value={id}>
                {categoryLabelEs(id)} ({agencyData.categories[id].agents.length} agentes)
              </option>
            ))}
          </select>
          <p className="field__hint">
            {categoryMeta ? `${categoryMeta.description} · ruta en el repositorio: \`${categoryId}/\`` : ""}
          </p>
        </div>

        <div className="field agent-row">
          <label htmlFor="agent-filter">Buscar en el catalogo</label>
          <input
            id="agent-filter"
            type="search"
            placeholder="Filtrar por nombre..."
            autoComplete="off"
            aria-label="Filtrar la lista de especialistas"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="agent">Agente especializado</label>
          <select
            id="agent"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            required
            size={8}
            className="select--tall"
          >
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agentDisplayName(agent)}
                </option>
              ))
            ) : (
              <option value="">— Ningun agente coincide con la busqueda —</option>
            )}
          </select>
          <p className="field__hint">{selectedAgent?.hint ?? ""}</p>
        </div>

        <div className="field-group field-group--generic">
          <h3 className="field-group__title">Contexto general (todas las carpetas)</h3>
          <div className="field">
            <label htmlFor="g-name">Proyecto, ticket o nombre de la solicitud</label>
            <input
              id="g-name"
              type="text"
              autoComplete="off"
              placeholder="Ej. Refactor API pagos · ticket PROJ-1042"
              value={generic.name}
              onChange={(e) => setGeneric((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="g-context">Que necesitas del especialista</label>
            <textarea
              id="g-context"
              rows={4}
              placeholder="Objetivo, alcance, entregables esperados, criterios de exito..."
              value={generic.context}
              onChange={(e) => setGeneric((prev) => ({ ...prev, context: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="g-stack">Stack, herramientas o restricciones tecnicas</label>
            <textarea
              id="g-stack"
              rows={2}
              placeholder="Lenguajes, repos, entornos, secretos ya disponibles... (opcional)"
              value={generic.stack}
              onChange={(e) => setGeneric((prev) => ({ ...prev, stack: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="g-refs">Enlaces y datos de entrada</label>
            <textarea
              id="g-refs"
              rows={2}
              placeholder="URLs a docs, Figma, issues, CSV... (opcional)"
              value={generic.refs}
              onChange={(e) => setGeneric((prev) => ({ ...prev, refs: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="g-constraints">Plazo, idioma, compliance</label>
            <input
              id="g-constraints"
              type="text"
              placeholder="Ej. Entrega viernes · solo ES · SOC2"
              value={generic.constraints}
              onChange={(e) => setGeneric((prev) => ({ ...prev, constraints: e.target.value }))}
            />
          </div>
        </div>

        <div className={`field-group ${showDesignFields ? "" : "is-hidden"}`}>
          <h3 className="field-group__title">Parametros adicionales · Diseno</h3>
          <div className="field">
            <label htmlFor="d-brand">Marca, tono y restricciones</label>
            <textarea
              id="d-brand"
              rows={2}
              placeholder="Guias, personalidad, competencia a evitar..."
              value={design.brand}
              onChange={(e) => setDesign((prev) => ({ ...prev, brand: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="d-goal">Objetivo de diseno / entregable</label>
            <textarea
              id="d-goal"
              rows={3}
              placeholder="Sistema UI, flujos, handoff, dark mode..."
              value={design.goal}
              onChange={(e) => setDesign((prev) => ({ ...prev, goal: e.target.value }))}
            />
          </div>
          <fieldset className="field field--checkboxes">
            <legend>Superficies</legend>
            {["Web", "Movil", "Desktop"].map((surface) => (
              <label key={surface}>
                <input
                  type="checkbox"
                  checked={design.surfaces.includes(surface)}
                  onChange={(event) => {
                    setDesign((prev) => {
                      const exists = prev.surfaces.includes(surface);
                      if (event.target.checked && !exists) {
                        return { ...prev, surfaces: [...prev.surfaces, surface] };
                      }
                      if (!event.target.checked && exists) {
                        return { ...prev, surfaces: prev.surfaces.filter((item) => item !== surface) };
                      }
                      return prev;
                    });
                  }}
                />{" "}
                {surface}
              </label>
            ))}
          </fieldset>
          <div className="field">
            <label htmlFor="d-accessibility">Accesibilidad</label>
            <select
              id="d-accessibility"
              value={design.accessibility}
              onChange={(e) => setDesign((prev) => ({ ...prev, accessibility: e.target.value }))}
            >
              <option value="WCAG AA (recomendado en agentes UI)">WCAG AA (recomendado)</option>
              <option value="WCAG AAA donde aplique">WCAG AAA donde aplique</option>
              <option value="Buenas prácticas sin certificación formal">Buenas practicas</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="d-deliverable">Tipo de salida esperada</label>
            <select
              id="d-deliverable"
              value={design.deliverable}
              onChange={(e) => setDesign((prev) => ({ ...prev, deliverable: e.target.value }))}
            >
              <option value="Sistema de diseño / tokens y componentes">Sistema de diseno / tokens</option>
              <option value="Pantallas o flujos específicos">Pantallas o flujos</option>
              <option value="Auditoría UI o consistencia">Auditoria UI</option>
              <option value="Handoff y especificaciones para desarrollo">Handoff a desarrollo</option>
              <option value="Investigación / síntesis UX">Investigacion / sintesis UX</option>
            </select>
          </div>
        </div>

        <div className={`field-group ${showProductFields ? "" : "is-hidden"}`}>
          <h3 className="field-group__title">Parametros adicionales · Producto (esqueleto PRD)</h3>
          <div className="field">
            <label htmlFor="p-problem">Problema u oportunidad + evidencia</label>
            <textarea
              id="p-problem"
              rows={3}
              placeholder="Dolor del usuario, datos, soporte, competencia..."
              value={product.problem}
              onChange={(e) => setProduct((prev) => ({ ...prev, problem: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="p-goals">Metas y metricas</label>
            <textarea
              id="p-goals"
              rows={2}
              placeholder="Metrica, baseline, objetivo"
              value={product.goals}
              onChange={(e) => setProduct((prev) => ({ ...prev, goals: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="p-non-goals">No objetivos</label>
            <textarea
              id="p-non-goals"
              rows={2}
              placeholder="Fuera de alcance en esta iteracion"
              value={product.nonGoals}
              onChange={(e) => setProduct((prev) => ({ ...prev, nonGoals: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="p-personas">Personas e historias clave</label>
            <textarea
              id="p-personas"
              rows={2}
              placeholder="Persona primaria, user stories"
              value={product.personas}
              onChange={(e) => setProduct((prev) => ({ ...prev, personas: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="p-stakeholders">Stakeholders y restricciones</label>
            <textarea
              id="p-stakeholders"
              rows={2}
              placeholder="Equipos, legal, ventanas de release"
              value={product.stakeholders}
              onChange={(e) => setProduct((prev) => ({ ...prev, stakeholders: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="p-horizon">Horizonte temporal</label>
            <input
              id="p-horizon"
              type="text"
              placeholder="Ej. Beta 6 semanas"
              value={product.horizon}
              onChange={(e) => setProduct((prev) => ({ ...prev, horizon: e.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="contact">Tu contacto (opcional)</label>
          <input
            id="contact"
            type="text"
            placeholder="Email o Slack"
            autoComplete="email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div className="actions">
          <button type="submit" className="btn btn--primary" disabled={!selectedAgent}>
            Generar brief
          </button>
          <button type="reset" className="btn btn--ghost">
            Limpiar
          </button>
        </div>
      </form>

      <section className={`output ${briefText ? "" : "is-hidden"}`} aria-live="polite">
        <div className="output__head">
          <h2>Brief generado</h2>
          <div className="output__actions">
            <button type="button" className="btn btn--small" onClick={copyBrief} disabled={!briefText}>
              {copyLabel}
            </button>
            <a className="btn btn--small btn--link" href={githubHref} target="_blank" rel="noopener noreferrer">
              Ver perfil en GitHub
            </a>
          </div>
        </div>
        <p className="output__note">
          Instalacion y conversiones: carpetas <code>scripts/</code> e <code>integrations/</code> del repo.{" "}
          <a href="https://github.com/msitarzewski/agency-agents#readme" target="_blank" rel="noopener noreferrer">
            README
          </a>
          .
        </p>
        <pre className="brief" tabIndex={0}>
          {briefText}
        </pre>
      </section>

      <footer className="footer">
        <p>
          MIT ·{" "}
          <a href="https://github.com/msitarzewski/agency-agents" target="_blank" rel="noopener noreferrer">
            msitarzewski/agency-agents
          </a>{" "}
          · {Object.values(agencyData.categories).reduce((total, cat) => total + cat.agents.length, 0)} agentes en el catalogo local
        </p>
      </footer>
    </div>
  );
}
