/** Credenciales por defecto; en producción puedes sobreescribir con Vite (sigue siendo cliente: el bundle puede inspeccionarse). */
export const APP_LOGIN_USER = (import.meta.env.VITE_APP_LOGIN_USER as string | undefined) ?? "ulpik.com";
export const APP_LOGIN_PASS = (import.meta.env.VITE_APP_LOGIN_PASS as string | undefined) ?? "2026@CTOulpik";
