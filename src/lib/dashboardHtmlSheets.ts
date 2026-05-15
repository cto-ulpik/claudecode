/** Adapta HTML de dashboards que leen Google Sheets para usar /api/sheets y refresco periódico. */

export const KPI_SPREADSHEET_ID = "1rDB2LwuXjhxMOXnXsMXDVtT2E_jpwA5MvTVsR7Ei4_8";

const SHIM_TAG_ID = "claudecode-sheets-shim";
const REFRESH_MS = 60_000;

const KNOWN_SHEET_TABS = ["ulpik.com", "deshunshoacrack.com"] as const;

const GOOGLE_SHEETS_RE =
  /docs\.google\.com\/spreadsheets|google\.com\/spreadsheets|2PACX-[a-zA-Z0-9-_]+/i;

const GOOGLE_URL_RE = /https?:\/\/[^\s"'`)]+docs\.google\.com\/spreadsheets[^\s"'`)]+/gi;

function extractSpreadsheetId(html: string): string {
  const direct = html.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (direct?.[1] && direct[1] !== "e") return direct[1];
  if (html.includes(KPI_SPREADSHEET_ID)) return KPI_SPREADSHEET_ID;
  if (GOOGLE_SHEETS_RE.test(html)) return KPI_SPREADSHEET_ID;
  return KPI_SPREADSHEET_ID;
}

function extractSheetTab(html: string): string {
  const fromQuery = html.match(/[?&]sheet=([^&"'`\s]+)/i);
  if (fromQuery?.[1]) {
    try {
      return decodeURIComponent(fromQuery[1]);
    } catch {
      return fromQuery[1];
    }
  }
  const fromConst = html.match(/SHEET_TAB\s*=\s*['"]([^'"]+)['"]/i);
  if (fromConst?.[1]) return fromConst[1];
  for (const tab of KNOWN_SHEET_TABS) {
    if (html.includes(tab)) return tab;
  }
  return KNOWN_SHEET_TABS[0];
}

function proxyUrl(spreadsheetId: string, sheetTab: string, format: "csv" | "json"): string {
  return `/api/sheets/${spreadsheetId}?sheet=${encodeURIComponent(sheetTab)}&format=${format}`;
}

function buildShim(spreadsheetId: string, sheetTab: string): string {
  const id = JSON.stringify(spreadsheetId);
  const tab = JSON.stringify(sheetTab);
  return `<script id="${SHIM_TAG_ID}">
(function () {
  var SHEET_ID = ${id};
  var SHEET_TAB = ${tab};
  var REFRESH_MS = ${REFRESH_MS};
  var origFetch = window.fetch.bind(window);

  function proxyEndpoint(wantJson) {
    var format = wantJson ? "json" : "csv";
    return "/api/sheets/" + SHEET_ID + "?sheet=" + encodeURIComponent(SHEET_TAB) + "&format=" + format + "&_=" + Date.now();
  }

  function isGoogleSheetsUrl(url) {
    return /docs\\.google\\.com\\/spreadsheets|google\\.com\\/spreadsheets/i.test(url);
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (isGoogleSheetsUrl(url)) {
      var wantJson = /out:json|format=json|tqx=out%3Ajson/i.test(url);
      return origFetch(proxyEndpoint(wantJson), init);
    }
    if (url.indexOf("/api/sheets/") === 0 && url.indexOf("_=") === -1) {
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      return origFetch(url + sep + "_=" + Date.now(), init);
    }
    return origFetch(input, init);
  };

  function scheduleRefresh() {
    function tick() {
      try {
        if (typeof init === "function") init();
        else if (typeof loadData === "function") loadData();
        else if (typeof refreshData === "function") refreshData();
      } catch (e) {
        console.warn("[claudecode-sheets]", e);
      }
    }
    tick();
    setInterval(tick, REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRefresh);
  } else {
    scheduleRefresh();
  }
})();
</script>`;
}

function stripExistingShim(html: string): string {
  return html.replace(
    new RegExp(`<script[^>]*id=["']${SHIM_TAG_ID}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`, "i"),
    "",
  );
}

function replaceGoogleUrls(html: string, spreadsheetId: string, sheetTab: string): string {
  return html.replace(GOOGLE_URL_RE, (url) => {
    const wantJson = /out:json|format=json|tqx=out%3Ajson/i.test(url);
    return proxyUrl(spreadsheetId, sheetTab, wantJson ? "json" : "csv");
  });
}

function injectShim(html: string, shim: string): string {
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>\n${shim}\n`);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n${shim}\n`);
  }
  return `${shim}\n${html}`;
}

export type TransformDashboardHtmlResult = {
  html: string;
  transformed: boolean;
  spreadsheetId?: string;
  sheetTab?: string;
};

/**
 * Si el HTML referencia Google Sheets, reescribe URLs al proxy del servidor e inyecta
 * fetch + auto-refresco (cada 60s) para reflejar cambios en la hoja.
 */
export function transformDashboardHtml(html: string): TransformDashboardHtmlResult {
  if (!GOOGLE_SHEETS_RE.test(html)) {
    return { html, transformed: false };
  }

  const spreadsheetId = extractSpreadsheetId(html);
  const sheetTab = extractSheetTab(html);
  const shim = buildShim(spreadsheetId, sheetTab);

  let out = stripExistingShim(html);
  out = replaceGoogleUrls(out, spreadsheetId, sheetTab);
  out = injectShim(out, shim);

  return {
    html: out,
    transformed: true,
    spreadsheetId,
    sheetTab,
  };
}
