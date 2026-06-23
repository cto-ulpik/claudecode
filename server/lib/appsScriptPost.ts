/** POST a Google Apps Script web app (maneja redirect 302 sin perder el body). */
export async function postToAppsScript(url: string, payload: Record<string, unknown>): Promise<string> {
  const body = JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };

  let res = await fetch(url, { method: "POST", headers, body, redirect: "manual" });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) {
      throw new Error(`Apps Script redirect sin Location (HTTP ${res.status})`);
    }
    res = await fetch(location, { method: "POST", headers, body, redirect: "follow" });
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apps Script HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return text;
}
