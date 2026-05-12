const STORAGE_KEY = "claudecode-dashboards-v1";

export type SavedDashboard = {
  id: string;
  name: string;
  category: string;
  html: string;
  createdAt: number;
};

function parseList(raw: string | null): SavedDashboard[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isSavedDashboard);
  } catch {
    return [];
  }
}

function isSavedDashboard(x: unknown): x is SavedDashboard {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.category === "string" &&
    typeof o.html === "string" &&
    typeof o.createdAt === "number"
  );
}

export function loadDashboards(): SavedDashboard[] {
  if (typeof localStorage === "undefined") return [];
  return parseList(localStorage.getItem(STORAGE_KEY));
}

export function saveDashboards(list: SavedDashboard[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addDashboard(input: { name: string; category: string; html: string }): SavedDashboard {
  const list = loadDashboards();
  const row: SavedDashboard = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}`,
    name: input.name.trim(),
    category: input.category.trim(),
    html: input.html,
    createdAt: Date.now(),
  };
  saveDashboards([row, ...list]);
  return row;
}

export function deleteDashboard(id: string): void {
  const list = loadDashboards().filter((d) => d.id !== id);
  saveDashboards(list);
}

export function uniqueCategories(dashboards: SavedDashboard[]): string[] {
  const set = new Set<string>();
  for (const d of dashboards) {
    const c = d.category.trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}
