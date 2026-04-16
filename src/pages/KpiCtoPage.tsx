import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUptimeStreakForTab } from "../data/kpiUptimeStreak";
import { KPI_SHEET_OPTIONS, kpiSheetLabel } from "../data/kpiSheets";
import { loadKpiSnapshot, type KpiSnapshot, type KpiDailyRow } from "../lib/kpi";
import "../styles/kpi-cto.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function fmt4(n: number): string {
  return n.toFixed(4);
}

/** Promedio de ms por región; los 0 se ignoran (sin medición o sin dato). */
function averageResponseMsExcludingZeros(samples: readonly number[]): number | null {
  const nonzero = samples.filter((v) => v !== 0);
  if (nonzero.length === 0) return null;
  return nonzero.reduce((a, v) => a + v, 0) / nonzero.length;
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

      {(() => {
        const streak = getUptimeStreakForTab(sheetTab);
        if (!streak) return null;
        return (
          <aside className="kpi-streak" aria-label="Días de uptime del servicio">
            <p className="kpi-streak__value">{streak.days}</p>
            <div className="kpi-streak__body">
              <p className="kpi-streak__title">{streak.title}</p>
              <p className="kpi-streak__detail">{streak.detail}</p>
            </div>
          </aside>
        );
      })()}

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
          formatValue={(v) => `${fmt4(v)}%`}
          formatRangeValue={fmt4}
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
          formatValue={(v) => `${fmt4(v)} ms`}
          formatRangeValue={fmt4}
          lines={responseSeries(filterSeriesByDays(snapshot?.series ?? [], daysFilter))}
        />
        <LineChartCard
          title="Calificaciones por fecha (0-100)"
          labels={filterSeriesByDays(snapshot?.series ?? [], daysFilter).map((row) => row.dateLabel)}
          formatValue={(v) => `${Math.round(v)}`}
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
  const avgResponse = averageResponseMsExcludingZeros(latest.responseTimesMs);
  const avgLighthouse = latest.lighthouseScores.reduce((acc, v) => acc + v, 0) / latest.lighthouseScores.length;
  return [
    { label: "Fecha", value: latest.dateLabel },
    { label: "Uptime servidor", value: `${fmt4(latest.uptimePercent)}%` },
    {
      label: "Tiempo respuesta promedio",
      value: avgResponse == null ? "-- ms" : `${fmt4(avgResponse)} ms`,
      detail: "Promedio eu_west, se_asia, us_east, us_west (sin contar 0 ms)",
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

function LineChartCard({
  title,
  labels,
  lines,
  formatValue = (v: number) => String(v),
  formatRangeValue = (v: number) => v.toFixed(2),
}: {
  title: string;
  labels: string[];
  lines: ChartLine[];
  formatValue?: (value: number) => string;
  /** Min/Max bajo el titulo (por defecto dos decimales). */
  formatRangeValue?: (value: number) => string;
}) {
  const [hover, setHover] = useState<{ idx: number; clientX: number; clientY: number } | null>(null);

  const width = 900;
  const height = 260;
  const padding = 28;
  const allValues = lines.flatMap((line) => line.values);
  const hasData = labels.length > 0 && allValues.length > 0;
  const min = hasData ? Math.min(...allValues) : 0;
  const max = hasData ? Math.max(...allValues) : 100;
  const range = max - min || 1;
  const span = Math.max(1, labels.length - 1);
  const stepX = (width - padding * 2) / span;

  const pointsFor = (values: number[]) =>
    values
      .map((value, idx) => {
        const x = padding + (idx * (width - padding * 2)) / span;
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  function onSvgPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    if (relX < 0 || relX > rect.width) {
      setHover(null);
      return;
    }
    const viewX = (relX / rect.width) * width;
    if (viewX < padding || viewX > width - padding) {
      setHover(null);
      return;
    }
    let idx = Math.round((viewX - padding) / stepX);
    idx = Math.max(0, Math.min(labels.length - 1, idx));
    setHover({ idx, clientX: event.clientX, clientY: event.clientY });
  }

  function onSvgPointerLeave() {
    setHover(null);
  }

  const hoverIdx = hover ? Math.min(Math.max(0, hover.idx), Math.max(0, labels.length - 1)) : null;
  const cursorX = hoverIdx != null ? padding + hoverIdx * stepX : null;

  let tooltipStyle: React.CSSProperties = {};
  if (hover) {
    const pad = 12;
    let left = hover.clientX + pad;
    let top = hover.clientY + pad;
    if (typeof window !== "undefined") {
      left = Math.min(left, window.innerWidth - 220);
      left = Math.max(8, left);
      if (top > window.innerHeight - 100) {
        top = hover.clientY - 100;
      }
      top = Math.max(8, top);
    }
    tooltipStyle = { left, top };
  }

  return (
    <article className="chart-card">
      <div className="chart-card__head">
        <h3>{title}</h3>
        <p>
          Min: {formatRangeValue(min)} · Max: {formatRangeValue(max)} · Registros: {labels.length}
        </p>
      </div>

      {hasData ? (
        <>
          <svg
            className="chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
            onPointerMove={onSvgPointerMove}
            onPointerLeave={onSvgPointerLeave}
            onPointerCancel={onSvgPointerLeave}
          >
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart__axis" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart__axis" />
            {cursorX != null ? (
              <line x1={cursorX} y1={padding} x2={cursorX} y2={height - padding} className="chart__cursor" />
            ) : null}
            {lines.map((line) => (
              <polyline key={line.name} fill="none" stroke={line.color} strokeWidth="2.5" points={pointsFor(line.values)} />
            ))}
            {hoverIdx != null
              ? lines.map((line) => {
                  const value = line.values[hoverIdx];
                  const x = padding + hoverIdx * stepX;
                  const y = height - padding - ((value - min) / range) * (height - padding * 2);
                  return <circle key={`dot-${line.name}`} className="chart__dot" cx={x} cy={y} r={4} fill={line.color} />;
                })
              : null}
          </svg>
          {hover && hoverIdx != null ? (
            <div className="chart-tooltip" style={tooltipStyle}>
              <strong>{labels[hoverIdx]}</strong>
              {lines.map((line) => (
                <div key={`tip-${line.name}`} className="chart-tooltip__row">
                  <span className="chart-tooltip__swatch" style={{ backgroundColor: line.color }} aria-hidden="true" />
                  <span>
                    {line.name}: <b>{formatValue(line.values[hoverIdx])}</b>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
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
