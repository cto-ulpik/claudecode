/** Lectura de Google Sheets vía endpoint público gviz (misma técnica que KPI CTO). */

interface GvizCell {
  v: string | number | boolean | null;
  f?: string;
}

interface GvizRow {
  c: Array<GvizCell | null>;
}

interface GvizTable {
  cols: { label: string }[];
  rows: GvizRow[];
}

interface GvizResponse {
  status?: string;
  errors?: { message?: string; reason?: string }[];
  table?: GvizTable;
}

function parseGvizPayload(raw: string): GvizResponse {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No se pudo parsear respuesta de Google Sheets");
  }
  return JSON.parse(raw.slice(start, end + 1)) as GvizResponse;
}

function cellText(cell: GvizCell | null | undefined): string {
  if (!cell || cell.v == null) return "";
  if (typeof cell.f === "string" && cell.f.trim()) return cell.f.trim();
  return String(cell.v).trim();
}

export function tableToRows(table: GvizTable): string[][] {
  const width = Math.max(
    1,
    table.cols?.length ?? 0,
    ...table.rows.map((row) => row.c?.length ?? 0),
  );
  return table.rows.map((row) => {
    const cells = (row.c ?? []).map((cell) => cellText(cell));
    while (cells.length < width) cells.push("");
    return cells;
  });
}

export function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(","),
    )
    .join("\n");
}

export async function fetchGoogleSheetRows(spreadsheetId: string, sheetTab: string): Promise<string[][]> {
  const id = spreadsheetId.trim();
  const sheet = sheetTab.trim();
  if (!id || !sheet) {
    throw new Error("Faltan spreadsheetId o nombre de pestaña (sheet).");
  }

  const endpoint = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?sheet=${encodeURIComponent(sheet)}&tqx=out:json`;
  const response = await fetch(endpoint, {
    headers: { "User-Agent": "claudecode-dashboard-proxy/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Google Sheets respondió HTTP ${response.status}`);
  }

  const raw = await response.text();
  const gviz = parseGvizPayload(raw);
  if (gviz.status === "error") {
    const msg =
      gviz.errors?.map((e) => e.message ?? e.reason).filter(Boolean).join(" · ") || "Error desconocido";
    throw new Error(`Google Sheets (${sheet}): ${msg}`);
  }
  if (!gviz.table?.rows?.length) {
    throw new Error(`Google Sheets (${sheet}): sin datos (revisa el nombre de la pestaña)`);
  }

  return tableToRows(gviz.table);
}
