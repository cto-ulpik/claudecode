function parseAppsScriptResponse(text: string, status: number): void {
  if (!text.trim().startsWith("{")) {
    throw new Error(`Apps Script HTTP ${status}: ${text.slice(0, 200)}`);
  }
  const data = JSON.parse(text) as { ok?: boolean; error?: string };
  if (data.ok === false) {
    throw new Error(data.error ?? "Google Sheets webhook rechazó la fila");
  }
  if (data.ok !== true) {
    throw new Error(`Apps Script respuesta inesperada: ${text.slice(0, 120)}`);
  }
}

/** GET ?data= a GAS (preserva query en redirect 302). */
async function getJsonToAppsScript(url: string, body: string): Promise<string> {
  const sep = url.includes("?") ? "&" : "?";
  const getUrl = `${url}${sep}data=${encodeURIComponent(body)}`;
  let res = await fetch(getUrl, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) {
      throw new Error(`Apps Script redirigió sin Location (HTTP ${res.status})`);
    }
    const join = location.includes("?") ? "&" : "?";
    res = await fetch(`${location}${join}data=${encodeURIComponent(body)}`, { redirect: "follow" });
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apps Script HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  parseAppsScriptResponse(text, res.status);
  return text;
}

/**
 * POST a GAS: el primer POST ya ejecuta doPost; si hay 302, seguir con GET
 * (un segundo POST al redirect vuelve a ejecutar el script → fila duplicada).
 */
async function postJsonToAppsScript(url: string, body: string): Promise<string> {
  const headers = { "Content-Type": "application/json" };
  let res = await fetch(url, { method: "POST", headers, body, redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) {
      throw new Error(`Apps Script redirigió sin Location (HTTP ${res.status})`);
    }
    res = await fetch(location, { method: "GET", redirect: "follow" });
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apps Script HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  parseAppsScriptResponse(text, res.status);
  return text;
}

async function tryPostOnce(url: string, body: string): Promise<string | null> {
  try {
    return await postJsonToAppsScript(url, body);
  } catch {
    return null;
  }
}

/** Envía datos al webhook GAS. GET ?data= primero (una sola ejecución); POST solo si falla. */
export async function postToAppsScript(url: string, payload: Record<string, unknown>): Promise<string> {
  const body = JSON.stringify(payload);

  try {
    return await getJsonToAppsScript(url, body);
  } catch {
    // fallback POST
  }

  const posted = await tryPostOnce(url, body);
  if (posted) return posted;

  throw new Error("Apps Script no respondió por GET ni POST");
}

/** POST grande a GAS (p. ej. PDF en base64). No usar GET ?data= por límite de URL. */
export async function postToAppsScriptPostOnly(
  url: string,
  payload: Record<string, unknown>
): Promise<string> {
  const body = JSON.stringify(payload);
  return postJsonToAppsScript(url, body);
}
