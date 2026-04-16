/**
 * Pestañas del Google Sheet: `tabName` debe coincidir exactamente con el nombre de la hoja en Drive.
 * `label` es lo que ve el usuario (p. ej. dominio o producto).
 */
export interface KpiSheetOption {
  tabName: string;
  label: string;
}

export const KPI_SHEET_OPTIONS: KpiSheetOption[] = [
  { tabName: "ulpik.com", label: "ulpik.com" },
  { tabName: "deshunshoacrack.com", label: "deshunshoacrack.com" },
];

export function kpiSheetLabel(tabName: string): string {
  return KPI_SHEET_OPTIONS.find((s) => s.tabName === tabName)?.label ?? tabName;
}
