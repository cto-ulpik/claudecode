/**
 * Contador de días de uptime mostrado en KPI CTO (independiente de la hoja de cálculo).
 *
 * - ulpik.com: cuenta desde la fecha/hora tras la última caída (hora local del navegador).
 * - deshunshoacrack.com: días BASE el día BASE_YMD; cada día calendario que pasa suma 1 (mañana = hoy + 1).
 *
 * Ajusta BASE_YMD cuando “re-sincrones” el contador (p. ej. cuando vuelves a comprobar que son 133).
 */
/** Inicio del uptime actual (tras la caída). Medianoche local del día indicado; ajusta hora si hubo recuperación más tarde. */
const ULPIK_UPTIME_SINCE = new Date(2026, 3, 9, 0, 0, 0); // 2026-04-09 00:00 local

const esDateOnly = new Intl.DateTimeFormat("es", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Días de racha que correspondían al día BASE_YMD (medianoche local). */
const DESHA_BASE_DAYS = 133;
/** Día de referencia (YYYY-MM-DD) en el que el servidor llevaba exactamente DESHA_BASE_DAYS días. */
const DESHA_BASE_YMD = "2026-04-15";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function wholeDaysSince(start: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
}

/** Días calendario transcurridos desde baseYmd (medianoche local) hasta `now` (mismo criterio). */
function calendarDaysSinceYmd(baseYmd: string, now: Date): number {
  const [y, m, d] = baseYmd.split("-").map(Number);
  const base = startOfLocalDay(new Date(y, m - 1, d));
  const end = startOfLocalDay(now);
  return Math.round((end.getTime() - base.getTime()) / 86_400_000);
}

export interface UptimeStreakView {
  /** Número grande que se muestra */
  days: number;
  /** Título corto bajo el número */
  title: string;
  /** Texto explicativo */
  detail: string;
}

export function getUptimeStreakForTab(tabName: string, now = new Date()): UptimeStreakView | null {
  if (tabName === "ulpik.com") {
    const days = wholeDaysSince(ULPIK_UPTIME_SINCE, now);
    return {
      days,
      title: "Días de uptime (servicio)",
      detail: `Última caída: ${esDateOnly.format(ULPIK_UPTIME_SINCE)}. Días de servicio estable desde esa fecha (medianoche local).`,
    };
  }

  if (tabName === "deshunshoacrack.com") {
    const extra = calendarDaysSinceYmd(DESHA_BASE_YMD, now);
    const days = DESHA_BASE_DAYS + extra;
    return {
      days,
      title: "Días de uptime (servidor)",
      detail: `Racha continua desde las 04:32:07 del día de inicio. Referencia: ${DESHA_BASE_DAYS} días el ${DESHA_BASE_YMD} — el contador sube 1 cada día calendario.`,
    };
  }

  return null;
}
