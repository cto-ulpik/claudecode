export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type ApiError = { error?: string; message?: string };

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || data.message || `Error ${res.status}`);
  }
  return data;
}

export async function fetchMe(): Promise<{ user: AuthUser; expiresAt: number } | null> {
  try {
    const data = await authFetch<{ ok: true; user: AuthUser; expiresAt: number }>("/api/auth/me");
    return { user: data.user, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  return authFetch<{ ok: true; user: AuthUser; expiresAt: number }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  try {
    await authFetch<{ ok: true }>("/api/auth/logout", { method: "POST", body: "{}" });
  } catch {
    /* ignore */
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ ok: true; message?: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function forgotPassword(email: string) {
  return authFetch<{ ok: true; message?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return authFetch<{ ok: true; message?: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
