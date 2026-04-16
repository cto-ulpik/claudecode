import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KPI_SHEET_OPTIONS, kpiSheetLabel } from "../data/kpiSheets";
import { loadKpiSnapshot, type KpiSnapshot, type KpiDailyRow } from "../lib/kpi";
import "../styles/kpi-cto.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function KpiCtoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<KpiSnapshot | null>(null);
  const [daysFilter, setDaysFilter] = useState("30");
  const [sheetTab, setSheetTab] = useState(KPI_SHEET_OPTIONS[0]?.tabName ?? "ulpik.com");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const label = kpiSheetLabel(sheetTab);
      const data = await loadKpiSnapshot(sheetTab, label);
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los KPI");
    } finally {
      setLoading(false);
    }
  }, [sheetTab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="kpi-page">
      <p className="kpi-page__back">
        <Link to="/">← Inicio</Link>
      </p>

      <header className="kpi-hero">
        <p className="kpi-hero__tag">Observabilidad</p>
        <h1>KPI CTO</h1>
        <p>
          Datos extraidos de la Google Sheet compartida · pestaña <strong>{snapshot?.sheetLabel ?? kpiSheetLabel(sheetTab)}</strong>.
        </p>
      </header>

      <div className="kpi-filters">
        <label htmlFor="sheet-filter">Hoja</label>
        <select id="sheet-filter" value={sheetTab} onChange={(event) => setSheetTab(event.target.value)}>
          {KPI_SHEET_OPTIONS.map((option) => (
            <option key={option.tabName} value={option.tabName}>
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor="days-filter">Rango</label>
        <select id="days-filter" value={daysFilter} onChange={(event) => setDaysFilter(event.target.value)}>
          <option value="7">Ultimos 7 dias</option>
          <option value="30">Ultimos 30 dias</option>
          <option value="90">Ultimos 90 dias</option>
          <option value="all">Todo el historico</option>
        </select>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Actualizando..." : "Recargar datos"}
        </button>
      </div>

      {error ? <p className="kpi-error">Error: {error}</p> : null}

      <section className="kpi-grid" aria-live="polite">
        {buildFilteredMetrics(snapshot?.series ?? [], daysFilter).length ? (
          buildFilteredMetrics(snapshot?.series ?? [], daysFilter).map((metric) => (
            <article className="kpi-card" key={`${metric.label}-${metric.value}`}>
              <p className="kpi-card__label">{metric.label}</p>
              <p className="kpi-card__value">{metric.value}</p>
              <p className="kpi-card__meta">{metric.detail ?? "Sin detalle adicional"}</p>
            </article>
          ))
        ) : (
          <article className="kpi-card">
            <p className="kpi-card__label">Sin datos</p>
            <p className="kpi-card__value">--</p>
            <p className="kpi-card__meta">La hoja no contiene filas con valores visibles.</p>
          </article>
        )}
      </section>

      <section className="kpi-charts">
        <h2>Graficas historicas</h2>
        <LineChartCard
          title="Uptime servidor (%)"
          labels={filterSeriesByDays(snapshot?.series ?? [], daysFilter).map((row) => row.dateLabel)}
          lines={[
            {
              name: "Uptime",
              color: "#67d694",
              values: filterSeriesByDays(snapshot?.series ?? [], daysFilter).map((row) => row.uptimePercent),
            },
          ]}
        />
        <LineChartCard
          title="Tiempos de respuesta por region (ms)"
          labels={filterSeriesByDays(snapshot?.series ?? [], daysFilter).map((row) => row.dateLabel)}
          lines={responseSeries(filterSeriesByDays(snapshot?.series ?? [], daysFilter))}
        />
        <LineChartCard
          title="Calificaciones por fecha (0-100)"
          labels={filterSeriesByDays(snapshot?.series ?? [], daysFilter).map((row) => row.dateLabel)}
          lines={scoreSeries(filterSeriesByDays(snapshot?.series ?? [], daysFilter))}
        />
      </section>

      <section className="kpi-help">
        <h2>Fuente de datos</h2>
        <p>Documento conectado:</p>
        <ul>
          <li>
            <a href={snapshot?.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer">
              Google Sheet KPI CTO ({snapshot?.sheetLabel ?? kpiSheetLabel(sheetTab)})
            </a>
          </li>
          <li>Ultima lectura: {snapshot ? formatDate(snapshot.fetchedAt) : "--"}</li>
        </ul>
      </section>
    </div>
  );
}

function parseDateLabel(label: string): Date | null {
  const raw = label.trim();
  if (!raw) return null;
  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) return new Date(iso);
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!dmy) return null;
  const day = Number(dmy[1]);
  const month = Number(dmy[2]) - 1;
  const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
  const dt = new Date(year, month, day);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function filterSeriesByDays(series: KpiDailyRow[], daysFilter: string): KpiDailyRow[] {
  if (daysFilter === "all") return series;
  const days = Number(daysFilter);
  if (!Number.isFinite(days) || days <= 0) return series;
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const filtered = series.filter((row) => {
    const dt = parseDateLabel(row.dateLabel);
    return dt ? dt.getTime() >= cutoff : false;
  });
  return filtered.length ? filtered : series;
}

function buildFilteredMetrics(series: KpiDailyRow[], daysFilter: string) {
  const filtered = filterSeriesByDays(series, daysFilter);
  const latest = filtered[filtered.length - 1];
  if (!latest) return [];
  const avgResponse = latest.responseTimesMs.reduce((acc, v) => acc + v, 0) / latest.responseTimesMs.length;
  const avgLighthouse = latest.lighthouseScores.reduce((acc, v) => acc + v, 0) / latest.lighthouseScores.length;
  return [
    { label: "Fecha", value: latest.dateLabel },
    { label: "Uptime servidor", value: `${latest.uptimePercent.toFixed(2)}%` },
    {
      label: "Tiempo respuesta promedio",
      value: `${avgResponse.toFixed(0)} ms`,
      detail: "Promedio eu_west, se_asia, us_east, us_west",
    },
    {
      label: "Calificacion Lighthouse promedio",
      value: `${avgLighthouse.toFixed(1)}/100`,
      detail: "Rendimiento, accesibilidad, practicas y SEO",
    },
  ];
}

type ChartLine = {
  name: string;
  color: string;
  values: number[];
};

const RESPONSE_REGIONS = ["eu_west", "se_asia", "us_east", "us_west"] as const;

function responseSeries(series: KpiDailyRow[]): ChartLine[] {
  const colors = ["#67d694", "#f2c66f", "#7fb8ff", "#d39bff"] as const;
  return RESPONSE_REGIONS.map((name, idx) => ({
    name,
    color: colors[idx],
    values: series.map((row) => row.responseTimesMs[idx]),
  }));
}

function scoreSeries(series: KpiDailyRow[]): ChartLine[] {
  return [
    { name: "Rendimiento", color: "#67d694", values: series.map((row) => row.lighthouseScores[0]) },
    { name: "Accesibilidad", color: "#7fb8ff", values: series.map((row) => row.lighthouseScores[1]) },
    { name: "Practicas recomendadas", color: "#f2c66f", values: series.map((row) => row.lighthouseScores[2]) },
    { name: "SEO", color: "#ff8c8c", values: series.map((row) => row.lighthouseScores[3]) },
  ];
}

function LineChartCard({ title, labels, lines }: { title: string; labels: string[]; lines: ChartLine[] }) {
  const width = 900;
  const height = 260;
  const padding = 28;
  const allValues = lines.flatMap((line) => line.values);
  const hasData = labels.length > 0 && allValues.length > 0;
  const min = hasData ? Math.min(...allValues) : 0;
  const max = hasData ? Math.max(...allValues) : 100;
  const range = max - min || 1;

  const pointsFor = (values: number[]) =>
    values
      .map((value, idx) => {
        const x = padding + (idx * (width - padding * 2)) / Math.max(1, values.length - 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <article className="chart-card">
      <div className="chart-card__head">
        <h3>{title}</h3>
        <p>
          Min: {min.toFixed(2)} · Max: {max.toFixed(2)} · Registros: {labels.length}
        </p>
      </div>

      {hasData ? (
        <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart__axis" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart__axis" />
          {lines.map((line) => (
            <polyline key={line.name} fill="none" stroke={line.color} strokeWidth="2.5" points={pointsFor(line.values)} />
          ))}
        </svg>
      ) : (
        <p className="chart__empty">Sin datos para graficar.</p>
      )}

      <div className="chart-legend">
        {lines.map((line) => (
          <span key={line.name}>
            <i style={{ backgroundColor: line.color }} /> {line.name}
          </span>
        ))}
      </div>
    </article>
  );
}
