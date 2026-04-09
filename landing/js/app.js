(function () {
  const data = window.AGENCY_DATA;
  if (!data || !data.categories) return;

  const CATEGORY_ORDER = [
    "engineering",
    "design",
    "marketing",
    "sales",
    "product",
    "testing",
    "support",
    "game-development",
    "academic",
    "specialized",
    "paid-media",
    "project-management",
    "strategy",
    "spatial-computing",
    "examples",
  ];

  const form = document.getElementById("brief-form");
  const categorySelect = document.getElementById("category");
  const categoryDesc = document.getElementById("category-desc");
  const agentFilter = document.getElementById("agent-filter");
  const agentSelect = document.getElementById("agent");
  const agentHint = document.getElementById("agent-hint");
  const designFields = document.getElementById("design-fields");
  const productFields = document.getElementById("product-fields");
  const outputSection = document.getElementById("output-section");
  const briefOut = document.getElementById("brief-out");
  const copyBtn = document.getElementById("copy-brief");
  const ghLink = document.getElementById("agent-gh-link");

  let filterTimer = null;
  let agentsInCategory = [];

  function currentCategoryId() {
    return categorySelect.value;
  }

  function populateCategoryOptions() {
    const frag = document.createDocumentFragment();
    for (const id of CATEGORY_ORDER) {
      const meta = data.categories[id];
      if (!meta) continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `${meta.label} (${meta.agents.length})`;
      frag.appendChild(opt);
    }
    categorySelect.innerHTML = "";
    categorySelect.appendChild(frag);
  }

  function updateCategoryDesc() {
    const id = currentCategoryId();
    const meta = data.categories[id];
    categoryDesc.textContent = meta ? `${meta.description} · carpeta \`${id}/\`` : "";
  }

  function populateAgents(filterText) {
    const id = currentCategoryId();
    const meta = data.categories[id];
    agentsInCategory = meta ? meta.agents.slice() : [];
    const q = (filterText || "").trim().toLowerCase();
    const filtered = q
      ? agentsInCategory.filter(
          (a) =>
            a.label.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q) ||
            a.path.toLowerCase().includes(q)
        )
      : agentsInCategory;

    agentSelect.innerHTML = filtered.length
      ? filtered.map((a) => `<option value="${a.id}">${a.label}</option>`).join("")
      : '<option value="">— Ningún agente coincide —</option>';

    updateAgentHint();
  }

  function updateAgentHint() {
    const meta = getSelectedAgentMeta();
    agentHint.textContent = meta ? meta.hint : "";
    if (meta && ghLink) {
      ghLink.href = data.baseRepo + meta.path;
    }
  }

  function setCategory(catId) {
    categorySelect.value = catId;
    updateCategoryDesc();
    designFields.classList.toggle("is-hidden", catId !== "design");
    productFields.classList.toggle("is-hidden", catId !== "product");
    agentFilter.value = "";
    populateAgents("");
  }

  function getSelectedAgentMeta() {
    const catId = currentCategoryId();
    const id = agentSelect.value;
    if (!id) return null;
    return data.categories[catId]?.agents.find((a) => a.id === id) || null;
  }

  function collectSurfaces() {
    return Array.from(document.querySelectorAll('input[name="d_surface"]:checked')).map((el) => el.value);
  }

  function buildBrief() {
    const meta = getSelectedAgentMeta();
    if (!meta) return "";

    const catId = currentCategoryId();
    const catMeta = data.categories[catId];
    const contact = document.getElementById("contact")?.value.trim();

    const gName = document.getElementById("g-name")?.value.trim() || "_(sin título)_";
    const gContext = document.getElementById("g-context")?.value.trim() || "_(pendiente)_";
    const gStack = document.getElementById("g-stack")?.value.trim();
    const gRefs = document.getElementById("g-refs")?.value.trim();
    const gConstraints = document.getElementById("g-constraints")?.value.trim();

    const lines = [];
    lines.push(`# Brief para agente: ${meta.label}`);
    lines.push("");
    lines.push(`**Repositorio**: https://github.com/msitarzewski/agency-agents`);
    lines.push(`**Carpeta**: \`${catId}/\` (${catMeta?.label ?? catId})`);
    lines.push(`**Archivo del agente**: \`${meta.path}\``);
    lines.push("");
    lines.push("## Instrucción de activación");
    lines.push("");
    lines.push(
      `Activa el modo del agente **${meta.label}** según el markdown en \`${meta.path}\`. ` +
        `Respeta personalidad, reglas críticas y plantillas de entregables del archivo.`
    );
    lines.push("");

    lines.push("## Contexto general");
    lines.push("");
    lines.push(`### Solicitud / proyecto`);
    lines.push(gName);
    lines.push("");
    lines.push(`### Objetivo y alcance`);
    lines.push(gContext);
    lines.push("");
    if (gStack) {
      lines.push(`### Stack y restricciones técnicas`);
      lines.push(gStack);
      lines.push("");
    }
    if (gRefs) {
      lines.push(`### Enlaces y datos de entrada`);
      lines.push(gRefs);
      lines.push("");
    }
    if (gConstraints) {
      lines.push(`### Plazo, idioma, compliance`);
      lines.push(gConstraints);
      lines.push("");
    }

    if (catId === "design") {
      const brand = document.getElementById("d-brand")?.value.trim();
      const goal = document.getElementById("d-goal")?.value.trim();
      const surfaces = collectSurfaces().join(", ") || "Web";
      const acc = document.getElementById("d-accessibility")?.value || "";
      const deliverable = document.getElementById("d-deliverable")?.value || "";

      lines.push("## Parámetros Design (repo / UI Designer y afines)");
      lines.push("");
      if (brand) {
        lines.push(`### Marca y tono`);
        lines.push(brand);
        lines.push("");
      }
      if (goal) {
        lines.push(`### Objetivo de diseño`);
        lines.push(goal);
        lines.push("");
      }
      lines.push(`### Superficies: ${surfaces}`);
      lines.push(`### Accesibilidad: ${acc}`);
      lines.push(`### Salida esperada: ${deliverable}`);
      lines.push("");
    }

    if (catId === "product") {
      const problem = document.getElementById("p-problem")?.value.trim();
      const goals = document.getElementById("p-goals")?.value.trim();
      const nonGoals = document.getElementById("p-non-goals")?.value.trim();
      const personas = document.getElementById("p-personas")?.value.trim();
      const stakeholders = document.getElementById("p-stakeholders")?.value.trim();
      const horizon = document.getElementById("p-horizon")?.value.trim();

      lines.push("## Parámetros Product (esqueleto PRD del proyecto)");
      lines.push("");
      if (problem) {
        lines.push(`### Problema / oportunidad y evidencia`);
        lines.push(problem);
        lines.push("");
      }
      if (goals) {
        lines.push(`### Metas y métricas`);
        lines.push(goals);
        lines.push("");
      }
      if (nonGoals) {
        lines.push(`### No objetivos`);
        lines.push(nonGoals);
        lines.push("");
      }
      if (personas) {
        lines.push(`### Personas e historias`);
        lines.push(personas);
        lines.push("");
      }
      if (stakeholders) {
        lines.push(`### Stakeholders`);
        lines.push(stakeholders);
        lines.push("");
      }
      if (horizon) {
        lines.push(`### Horizonte temporal`);
        lines.push(horizon);
        lines.push("");
      }
    }

    if (contact) {
      lines.push(`**Contacto**: ${contact}`);
      lines.push("");
    }

    lines.push("---");
    lines.push(`_Landing agency-agents · ${new Date().toISOString().slice(0, 10)}_`);

    return lines.join("\n");
  }

  categorySelect.addEventListener("change", () => {
    setCategory(currentCategoryId());
  });

  agentFilter.addEventListener("input", () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => populateAgents(agentFilter.value), 120);
  });

  agentSelect.addEventListener("change", updateAgentHint);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!agentSelect.value) return;
    const text = buildBrief();
    briefOut.textContent = text;
    outputSection.classList.remove("is-hidden");
    outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      populateCategoryOptions();
      setCategory(CATEGORY_ORDER[0] || Object.keys(data.categories)[0]);
      outputSection.classList.add("is-hidden");
      briefOut.textContent = "";
    }, 0);
  });

  copyBtn.addEventListener("click", async () => {
    const t = briefOut.textContent;
    try {
      await navigator.clipboard.writeText(t);
      copyBtn.textContent = "Copiado";
      setTimeout(() => {
        copyBtn.textContent = "Copiar";
      }, 2000);
    } catch {
      copyBtn.textContent = "Error";
      setTimeout(() => {
        copyBtn.textContent = "Copiar";
      }, 2000);
    }
  });

  populateCategoryOptions();
  setCategory(CATEGORY_ORDER[0] || Object.keys(data.categories)[0]);
})();
