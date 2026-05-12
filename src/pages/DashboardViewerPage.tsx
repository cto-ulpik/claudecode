import { FormEvent, type MouseEvent, useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  addDashboard,
  deleteDashboard,
  loadDashboards,
  updateDashboard,
  uniqueCategories,
  type SavedDashboard,
} from "../lib/dashboardStorage";
import "../styles/dashboard-viewer.css";

const EMBED_SANDBOX =
  "allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation";
const THUMB_SANDBOX = "allow-scripts allow-downloads allow-presentation";

export function DashboardViewerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get("v");

  const [list, setList] = useState<SavedDashboard[]>(() => loadDashboards());
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [html, setHtml] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setList(loadDashboards());
  }, []);

  const viewing = useMemo(() => list.find((d) => d.id === viewId) ?? null, [list, viewId]);

  const categories = useMemo(() => uniqueCategories(list), [list]);

  const filtered = useMemo(() => {
    if (!filterCat) return list;
    return list.filter((d) => d.category.trim() === filterCat);
  }, [list, filterCat]);

  const closeEmbed = useCallback(() => {
    searchParams.delete("v");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const toggleFormPanel = useCallback(() => {
    if (showAddForm) {
      setShowAddForm(false);
      setEditingId(null);
      setName("");
      setCategory("");
      setHtml("");
      setFormMsg("");
    } else {
      setEditingId(null);
      setName("");
      setCategory("");
      setHtml("");
      setFormMsg("");
      setShowAddForm(true);
    }
  }, [showAddForm]);

  const startEdit = useCallback((d: SavedDashboard, e: MouseEvent) => {
    e.stopPropagation();
    setName(d.name);
    setCategory(d.category);
    setHtml(d.html);
    setEditingId(d.id);
    setFormMsg("");
    setShowAddForm(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setName("");
    setCategory("");
    setHtml("");
    setFormMsg("");
  }, []);

  const onSubmitForm = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setFormMsg("");
      const n = name.trim();
      const c = category.trim();
      const h = html.trim();
      if (!n || !c || !h) {
        setFormMsg("Completa nombre, categoría y HTML.");
        return;
      }
      if (editingId) {
        const updated = updateDashboard(editingId, { name: n, category: c, html: h });
        if (!updated) {
          setFormMsg("No se encontró el dashboard a editar.");
          return;
        }
        setEditingId(null);
        setName("");
        setCategory("");
        setHtml("");
        refresh();
        setFormMsg("Cambios guardados en este navegador.");
        return;
      }
      addDashboard({ name: n, category: c, html: h });
      setName("");
      setCategory("");
      setHtml("");
      refresh();
      setFormMsg("Dashboard guardado en este navegador.");
    },
    [name, category, html, editingId, refresh],
  );

  const onDelete = useCallback(
    (id: string, displayName: string, e: MouseEvent) => {
      e.stopPropagation();
      const label = displayName.trim() || "este dashboard";
      if (
        !window.confirm(
          `¿Estás seguro de que quieres eliminar «${label}»? Se borrará del almacenamiento de este navegador.`,
        )
      ) {
        return;
      }
      deleteDashboard(id);
      if (viewId === id) closeEmbed();
      refresh();
    },
    [viewId, closeEmbed, refresh],
  );

  const openEmbed = useCallback(
    (id: string) => {
      setSearchParams({ v: id }, { replace: false });
    },
    [setSearchParams],
  );

  if (viewId && viewing) {
    return (
      <div className="dash-view dash-view--embed">
        <div className="dash-view__embed-bar">
          <h2>{viewing.name}</h2>
          <button type="button" className="dash-view__embed-back" onClick={closeEmbed}>
            Volver al listado
          </button>
        </div>
        <iframe
          className="dash-view__embed-frame"
          title={viewing.name}
          srcDoc={viewing.html}
          sandbox={EMBED_SANDBOX}
        />
      </div>
    );
  }

  if (viewId && !viewing) {
    return (
      <div className="dash-view">
        <p className="dash-view__back">
          <Link to="/visualizador-dashboards">← Inicio visualizador</Link>
        </p>
        <p className="dash-view__msg dash-view__msg--error">No se encontró ese dashboard. Puede haber sido eliminado.</p>
        <button type="button" className="dash-view__btn" onClick={closeEmbed}>
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="dash-view">
      <p className="dash-view__back">
        <Link to="/">← Volver al inicio</Link>
      </p>

      <header className="dash-view__hero">
        <p className="dash-view__tag">Herramienta local</p>
        <h1>Visualizador de dashboards</h1>
        <p>
          Los dashboards se guardan solo en este navegador. Filtra por categoría y abre una miniatura para ver el HTML
          embebido a pantalla completa. Puedes editar nombre, categoría y HTML desde «Editar» en cada tarjeta, o crear
          uno nuevo con «Añadir dashboard».
        </p>
      </header>

      <section className="dash-view__toolbar" aria-labelledby="dash-grid-title">
        <div className="dash-view__toolbar-head">
          <h2 id="dash-grid-title">Dashboards guardados</h2>
          <button
            type="button"
            className="dash-view__btn-toggle"
            aria-expanded={showAddForm}
            aria-controls="dash-add-form"
            onClick={toggleFormPanel}
          >
            {showAddForm ? "Ocultar formulario" : "Añadir dashboard"}
          </button>
        </div>
        <div className="dash-view__filters" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={`dash-view__filter${filterCat === null ? " dash-view__filter--active" : ""}`}
            onClick={() => setFilterCat(null)}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`dash-view__filter${filterCat === c ? " dash-view__filter--active" : ""}`}
              onClick={() => setFilterCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="dash-view__empty">
          {list.length === 0
            ? "Aún no hay dashboards. Pulsa «Añadir dashboard» para crear el primero."
            : "Ningún dashboard en esta categoría."}
        </p>
      ) : (
        <div className="dash-view__grid">
          {filtered.map((d) => (
            <button key={d.id} type="button" className="dash-view__card" onClick={() => openEmbed(d.id)}>
              <div className="dash-view__thumb-wrap" aria-hidden="true">
                <iframe title={`Vista previa: ${d.name}`} srcDoc={d.html} sandbox={THUMB_SANDBOX} />
              </div>
              <div className="dash-view__card-body">
                <h3 className="dash-view__card-title">{d.name}</h3>
                <div className="dash-view__card-meta">
                  <span className="dash-view__cat">{d.category}</span>
                  <span className="dash-view__card-actions">
                    <button
                      type="button"
                      className="dash-view__edit"
                      onClick={(e) => startEdit(d, e)}
                      aria-label={`Editar ${d.name}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="dash-view__del"
                      onClick={(e) => onDelete(d.id, d.name, e)}
                      aria-label={`Eliminar ${d.name}`}
                    >
                      Eliminar
                    </button>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div id="dash-add-form" className="dash-view__add-panel" hidden={!showAddForm}>
        <form className="dash-view__form" onSubmit={onSubmitForm}>
          <div className="dash-view__form-head">
            <h2 className="dash-view__form-title">{editingId ? "Editar dashboard" : "Nuevo dashboard"}</h2>
            {editingId ? (
              <button type="button" className="dash-view__btn-cancel" onClick={cancelEdit}>
                Cancelar edición
              </button>
            ) : null}
          </div>
          <div className="dash-view__field">
            <label htmlFor="dash-name">Nombre</label>
            <input
              id="dash-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              placeholder="Ej. Ventas Q1"
            />
          </div>
          <div className="dash-view__field">
            <label htmlFor="dash-cat">Categoría</label>
            <input
              id="dash-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              autoComplete="off"
              placeholder="Ej. Finanzas, Operaciones…"
            />
          </div>
          <div className="dash-view__field">
            <label htmlFor="dash-html">HTML</label>
            <textarea
              id="dash-html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Pega un fragmento o documento HTML completo."
              spellCheck={false}
            />
          </div>
          <div className="dash-view__actions">
            <button type="submit" className="dash-view__btn">
              {editingId ? "Guardar cambios" : "Guardar dashboard"}
            </button>
            {formMsg ? (
              <p className={`dash-view__msg${formMsg.includes("Completa") ? " dash-view__msg--error" : ""}`}>
                {formMsg}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
