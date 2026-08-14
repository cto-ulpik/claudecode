/** Correos autorizados para ia.ulpik.com (áreas internas). */
export const ALLOWED_USERS: Array<{ email: string; name: string }> = [
  { email: "cpa@ulpik.com", name: "Beatriz de Ulpik" },
  { email: "churchill@ulpik.com", name: "Churchill ." },
  { email: "courses@ulpik.com", name: "Cursos De Shunsho A Crack" },
  { email: "ceo@ulpik.com", name: "Esteban de Ulpik" },
  { email: "gh@ulpik.com", name: "Fabian de Ulpik" },
  { email: "legal@ulpik.com", name: "Javier de Ulpik" },
  { email: "cmo@ulpik.com", name: "Juan Pablo de Ulpik" },
  { email: "legal2@ulpik.com", name: "Marianela de Ulpik" },
  { email: "legal5@ulpik.com", name: "Martin Coello de Ulpik" },
  { email: "ed@ulpik.com", name: "Mateo de Ulpik" },
  { email: "cto@ulpik.com", name: "Michael de Ulpik" },
  { email: "nrm@ulpik.com", name: "Nicolás de Ulpik" },
  { email: "cpo@ulpik.com", name: "Rafaela de Ulpik" },
  { email: "legal4@ulpik.com", name: "Samantha de Ulpik" },
  { email: "legal3@ulpik.com", name: "Sebastian de Ulpik" },
  { email: "clo@ulpik.com", name: "Sofía de Ulpik" },
];

export const INITIAL_PASSWORD = process.env.AUTH_INITIAL_PASSWORD?.trim() || "ulpik@2026.";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;
export const SESSION_COOKIE = "claudecode_sid";

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export function isAllowedEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return ALLOWED_USERS.some((u) => u.email === e);
}
