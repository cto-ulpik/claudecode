export interface KpiDailyRow {
  dateLabel: string;
  uptimePercent: number;
  responseTimesMs: [number, number, number, number];
  lighthouseScores: [number, number, number, number];
}

export interface KpiSnapshot {
  fetchedAt: string;
  sourceUrl: string;
  /** Nombre de pestaña en Google Sheets (parametro `sheet=`). */
  sheetTabName: string;
  /** Etiqueta amigable (p. ej. ulpik.com). */
  sheetLabel: string;
  series: KpiDailyRow[];
}

interface GvizCell {
  v: string | number | boolean | null;
  f?: string;
}

interface GvizRow {
  c: Array<GvizCell | null>;
}

interface GvizCol {
  label: string;
}

interface GvizTable {
  cols: GvizCol[];
  rows: GvizRow[];
}

interface GvizError {
  message?: string;
  reason?: string;
}

interface GvizResponse {
  status?: string;
  errors?: GvizError[];
  table?: GvizTable;
}

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1rDB2LwuXjhxMOXnXsMXDVtT2E_jpwA5MvTVsR7Ei4_8/edit?usp=sharing";
const SHEET_ID = "1rDB2LwuXjhxMOXnXsMXDVtT2E_jpwA5MvTVsR7Ei4_8";

function parseGvizPayload(raw: string): GvizResponse {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No se pudo parsear respuesta de Google Sheets");
  }
  const json = raw.slice(start, end + 1);
  return JSON.parse(json) as GvizResponse;
}

function cellText(cell: GvizCell | null | undefined): string {
  if (!cell || cell.v == null) return "";
  if (typeof cell.f === "string" && cell.f.trim()) return cell.f.trim();
  return String(cell.v).trim();
}

function normalizeRows(table: GvizTable): string[][] {
  const width = Math.max(
    10,
    table.cols?.length ?? 0,
    ...table.rows.map((row) => row.c?.length ?? 0)
  );
  return table.rows.map((row) => {
    const cells = (row.c ?? []).map((cell) => cellText(cell));
    while (cells.length < width) {
      cells.push("");
    }
    return cells;
  });
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace("%", "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function rowToSeries(cells: string[]): KpiDailyRow | null {
  const dateLabel = cells[0]?.trim() ?? "";
  if (!dateLabel) return null;

  const uptime = parseNumber(cells[1]);
  const r1 = parseNumber(cells[2]);
  const r2 = parseNumber(cells[3]);
  const r3 = parseNumber(cells[4]);
  const r4 = parseNumber(cells[5]);
  const s1 = parseNumber(cells[6]);
  const s2 = parseNumber(cells[7]);
  const s3 = parseNumber(cells[8]);
  const s4 = parseNumber(cells[9]);

  if ([uptime, r1, r2, r3, r4, s1, s2, s3, s4].some((v) => v == null)) {
    return null;
  }

  return {
    dateLabel,
    uptimePercent: uptime as number,
    responseTimesMs: [r1 as number, r2 as number, r3 as number, r4 as number],
    lighthouseScores: [s1 as number, s2 as number, s3 as number, s4 as number],
  };
}

export async function loadKpiSnapshot(sheetTabName: string, sheetLabel: string): Promise<KpiSnapshot> {
  const endpoint = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetTabName)}&tqx=out:json`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`No se pudo leer Google Sheet (HTTP ${response.status})`);
  }
  const raw = await response.text();
  const gviz = parseGvizPayload(raw) as GvizResponse;
  if (gviz.status === "error") {
    const msg = gviz.errors?.map((e) => e.message ?? e.reason).filter(Boolean).join(" · ") || "Error desconocido";
    throw new Error(`Google Sheets (${sheetTabName}): ${msg}`);
  }
  if (!gviz.table) {
    throw new Error(`Google Sheets (${sheetTabName}): respuesta sin tabla`);
  }
  const rows = normalizeRows(gviz.table);
  const series = rows.map((cells) => rowToSeries(cells)).filter((row): row is KpiDailyRow => row !== null);

  return {
    fetchedAt: new Date().toISOString(),
    sourceUrl: SHEET_URL,
    sheetTabName,
    sheetLabel,
    series,
  };
}
