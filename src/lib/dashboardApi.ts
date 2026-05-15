import type { SavedDashboard } from "./dashboardStorage";

const BASE = "/api/dashboards";

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Error del servidor (${res.status})`;
}

export async function fetchDashboards(): Promise<SavedDashboard[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SavedDashboard[]>;
}

export async function createDashboard(input: {
  name: string;
  category: string;
  html: string;
}): Promise<SavedDashboard> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SavedDashboard>;
}

export async function updateDashboardApi(
  id: string,
  input: { name: string; category: string; html: string },
): Promise<SavedDashboard> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SavedDashboard>;
}

export async function deleteDashboardApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
}
