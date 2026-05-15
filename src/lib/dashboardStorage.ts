export type SavedDashboard = {
  id: string;
  name: string;
  category: string;
  html: string;
  createdAt: number;
};

const LEGACY_STORAGE_KEY = "claudecode-dashboards-v1";

export function uniqueCategories(dashboards: SavedDashboard[]): string[] {
  const set = new Set<string>();
  for (const d of dashboards) {
    const c = d.category.trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

/** Datos antiguos guardados solo en el navegador (antes de SQLite). */
export function loadLegacyDashboards(): SavedDashboard[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isLegacyRow);
  } catch {
    return [];
  }
}

function isLegacyRow(x: unknown): x is SavedDashboard {
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

export function clearLegacyDashboards(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
