import { FormEvent, type MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createDashboard,
  deleteDashboardApi,
  fetchDashboards,
  updateDashboardApi,
} from "../lib/dashboardApi";
import { transformDashboardHtml } from "../lib/dashboardHtmlSheets";
import {
  clearLegacyDashboards,
  loadLegacyDashboards,
  uniqueCategories,
  type SavedDashboard,
} from "../lib/dashboardStorage";
import "../styles/dashboard-viewer.css";

const EMBED_SANDBOX =
  "allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation";
const THUMB_SANDBOX = "allow-scripts allow-downloads allow-presentation";

function htmlForEmbed(source: string): string {
  return transformDashboardHtml(source).html;
}

export function DashboardViewerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get("v");

  const [list, setList] = useState<SavedDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [html, setHtml] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await fetchDashboards();
    setList(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError("");
      try {
        let data = await fetchDashboards();
        const legacy = loadLegacyDashboards();
        if (data.length === 0 && legacy.length > 0) {
          for (const d of legacy) {
            await createDashboard({
              name: d.name,
              category: d.category,
              html: d.html,
            });
          }
          clearLegacyDashboards();
          data = await fetchDashboards();
        }
        if (!cancelled) setList(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "No se pudo conectar con el servidor. Ejecuta «npm run dev» (incluye la API con SQLite).",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
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
    async (e: FormEvent) => {
      e.preventDefault();
      setFormMsg("");
      const n = name.trim();
      const c = category.trim();
      const rawHtml = html.trim();
      if (!n || !c || !rawHtml) {
        setFormMsg("Completa nombre, categoría y HTML.");
        return;
      }
      const { html: h, transformed, sheetTab } = transformDashboardHtml(rawHtml);
      setSaving(true);
      try {
        const sheetsNote = transformed
          ? ` Google Sheets (${sheetTab ?? "hoja"}) vía servidor; se actualiza cada 60 s.`
          : "";
        if (editingId) {
          await updateDashboardApi(editingId, { name: n, category: c, html: h });
          setEditingId(null);
          setName("");
          setCategory("");
          setHtml("");
          await refresh();
          setFormMsg(`Cambios guardados en el servidor.${sheetsNote}`);
        } else {
          await createDashboard({ name: n, category: c, html: h });
          setName("");
          setCategory("");
          setHtml("");
          await refresh();
          setFormMsg(`Dashboard guardado. Lo verán todos los usuarios de esta app.${sheetsNote}`);
        }
      } catch (err) {
        setFormMsg(err instanceof Error ? err.message : "No se pudo guardar.");
      } finally {
        setSaving(false);
      }
    },
    [name, category, html, editingId, refresh],
  );

  const onDelete = useCallback(
    async (id: string, displayName: string, e: MouseEvent) => {
      e.stopPropagation();
      const label = displayName.trim() || "este dashboard";
      if (
        !window.confirm(
          `¿Estás seguro de que quieres eliminar «${label}»? Se borrará del servidor para todos los usuarios.`,
        )
      ) {
        return;
      }
      try {
        await deleteDashboardApi(id);
        if (viewId === id) closeEmbed();
        await refresh();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "No se pudo eliminar.");
      }
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
          srcDoc={htmlForEmbed(viewing.html)}
          sandbox={EMBED_SANDBOX}
        />
      </div>
    );
  }

  if (viewId && !viewing && !loading) {
    return (
      <div className="dash-view">
        <p className="dash-view__back">
          <Link to="/visualizador-dashboards">← Inicio visualizador</Link>
        </p>
        <p className="dash-view__msg dash-view__msg--error">
          No se encontró ese dashboard. Puede haber sido eliminado.
        </p>
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
        <p className="dash-view__tag">Servidor compartido</p>
        <h1>Visualizador de dashboards</h1>
        <p>
          Los dashboards se guardan en una base SQLite del servidor: cualquier persona con acceso a esta app los ve en
          cualquier navegador. Si el HTML usa Google Sheets, al guardar se adapta al proxy del servidor y se refresca cada
          60 segundos. Filtra por categoría, abre una miniatura o edita desde cada tarjeta.
        </p>
      </header>

      {loadError ? (
        <p className="dash-view__banner dash-view__banner--error" role="alert">
          {loadError}
        </p>
      ) : null}

      <section className="dash-view__toolbar" aria-labelledby="dash-grid-title">
        <div className="dash-view__toolbar-head">
          <h2 id="dash-grid-title">Dashboards guardados</h2>
          <button
            type="button"
            className="dash-view__btn-toggle"
            aria-expanded={showAddForm}
            aria-controls="dash-add-form"
            onClick={toggleFormPanel}
            disabled={!!loadError || loading}
          >
            {showAddForm ? "Ocultar formulario" : "Añadir dashboard"}
          </button>
        </div>
        <div className="dash-view__filters" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={`dash-view__filter${filterCat === null ? " dash-view__filter--active" : ""}`}
            onClick={() => setFilterCat(null)}
            disabled={loading}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`dash-view__filter${filterCat === c ? " dash-view__filter--active" : ""}`}
              onClick={() => setFilterCat(c)}
              disabled={loading}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="dash-view__empty">Cargando dashboards…</p>
      ) : filtered.length === 0 ? (
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
                <iframe title={`Vista previa: ${d.name}`} srcDoc={htmlForEmbed(d.html)} sandbox={THUMB_SANDBOX} />
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
                      onClick={(e) => void onDelete(d.id, d.name, e)}
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
        <form className="dash-view__form" onSubmit={(e) => void onSubmitForm(e)}>
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>
          <div className="dash-view__actions">
            <button type="submit" className="dash-view__btn" disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Guardar dashboard"}
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
