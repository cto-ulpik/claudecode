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

async function tryPost(url: string, body: string): Promise<string | null> {
  const headers = { "Content-Type": "application/json" };
  try {
    let res = await fetch(url, { method: "POST", headers, body, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      res = await fetch(location, { method: "POST", headers, body, redirect: "follow" });
    }
    const text = await res.text();
    if (!res.ok) return null;
    parseAppsScriptResponse(text, res.status);
    return text;
  } catch {
    return null;
  }
}

/** Envía datos al webhook GAS. POST primero; si falla (405 habitual), usa GET ?data=. */
export async function postToAppsScript(url: string, payload: Record<string, unknown>): Promise<string> {
  const body = JSON.stringify(payload);

  const posted = await tryPost(url, body);
  if (posted) return posted;

  const sep = url.includes("?") ? "&" : "?";
  const getUrl = `${url}${sep}data=${encodeURIComponent(body)}`;
  const res = await fetch(getUrl, { redirect: "follow" });
  const text = await res.text();
  parseAppsScriptResponse(text, res.status);
  return text;
}
