import { fetchMe, type AuthUser } from "./api";

let cachedUser: AuthUser | null = null;
let cachedExpiresAt = 0;

export function getCachedUser(): AuthUser | null {
  if (!cachedUser) return null;
  if (cachedExpiresAt && Date.now() >= cachedExpiresAt) {
    cachedUser = null;
    return null;
  }
  return cachedUser;
}

export function setCachedSession(user: AuthUser | null, expiresAt?: number): void {
  cachedUser = user;
  cachedExpiresAt = expiresAt || 0;
}

export async function refreshAuth(): Promise<AuthUser | null> {
  const me = await fetchMe();
  if (!me) {
    setCachedSession(null);
    return null;
  }
  setCachedSession(me.user, me.expiresAt);
  return me.user;
}

/** @deprecated Usar refreshAuth / login API. Mantener por compatibilidad. */
export function isAuthenticated(): boolean {
  return Boolean(getCachedUser());
}

export function loginSession(): void {
  /* no-op: la sesión vive en cookie HttpOnly del servidor */
}

export function logoutSession(): void {
  setCachedSession(null);
}
