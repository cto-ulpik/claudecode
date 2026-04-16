const AUTH_SESSION_KEY = "claudecode-authenticated";

export function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function loginSession(): void {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function logoutSession(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
