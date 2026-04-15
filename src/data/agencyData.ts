import dataRaw from "../../agentes/js/data.js?raw";
import type { AgencyData } from "../types";

function parseAgencyData(raw: string): AgencyData {
  const json = raw.replace(/^window\.AGENCY_DATA\s*=\s*/, "").replace(/;\s*$/, "");
  return JSON.parse(json) as AgencyData;
}

export const agencyData = parseAgencyData(dataRaw);

export const CATEGORY_ORDER = [
  "engineering",
  "design",
  "marketing",
  "sales",
  "product",
  "testing",
  "support",
  "game-development",
  "academic",
  "specialized",
  "paid-media",
  "project-management",
  "strategy",
  "spatial-computing",
  "examples",
] as const;

export const CATEGORY_LABEL_ES: Record<string, string> = {
  engineering: "Ingeniería",
  design: "Diseño",
  marketing: "Mercadotecnia",
  sales: "Ventas",
  product: "Producto",
  testing: "Pruebas y calidad",
  support: "Soporte",
  "game-development": "Desarrollo de videojuegos",
  academic: "Académico",
  specialized: "Especializados",
  "paid-media": "Medios de pago",
  "project-management": "Gestión de proyectos",
  strategy: "Estrategia",
  "spatial-computing": "Computación espacial",
  examples: "Ejemplos",
};

export function categoryLabelEs(id: string): string {
  return CATEGORY_LABEL_ES[id] ?? agencyData.categories[id]?.label ?? id;
}
