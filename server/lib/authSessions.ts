import type { Request } from "express";
import { getDb } from "../db.js";
import { SESSION_TTL_MS } from "./authConfig.js";
import { hashToken, randomToken } from "./password.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: number;
};

export function findUserByEmail(email: string): (AuthUser & { password_hash: string }) | null {
  const row = getDb()
    .prepare("SELECT id, email, name, password_hash FROM auth_users WHERE email = ?")
    .get(email) as { id: string; email: string; name: string; password_hash: string } | undefined;
  return row || null;
}

export function findUserById(id: string): AuthUser | null {
  const row = getDb()
    .prepare("SELECT id, email, name FROM auth_users WHERE id = ?")
    .get(id) as AuthUser | undefined;
  return row || null;
}

export function createSession(userId: string, req: Request): { token: string; expiresAt: number } {
  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  getDb()
    .prepare(
      `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, expires_at, revoked_at, user_agent, ip)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`
    )
    .run(
      `s_${now.toString(36)}_${randomToken(4)}`,
      userId,
      tokenHash,
      now,
      expiresAt,
      String(req.headers["user-agent"] || "").slice(0, 300),
      String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").slice(0, 120)
    );
  return { token, expiresAt };
}

export function getSessionByToken(token: string): (AuthSession & { user: AuthUser }) | null {
  const tokenHash = hashToken(token);
  const row = getDb()
    .prepare(
      `SELECT s.id, s.user_id, s.expires_at, s.revoked_at, u.id as uid, u.email, u.name
       FROM auth_sessions s
       JOIN auth_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        user_id: string;
        expires_at: number;
        revoked_at: number | null;
        uid: string;
        email: string;
        name: string;
      }
    | undefined;

  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at <= Date.now()) return null;
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    user: { id: row.uid, email: row.email, name: row.name },
  };
}

export function revokeSessionByToken(token: string): void {
  const tokenHash = hashToken(token);
  getDb()
    .prepare("UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL")
    .run(Date.now(), tokenHash);
}

export function revokeAllSessionsForUser(userId: string): void {
  getDb()
    .prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL")
    .run(Date.now(), userId);
}

export function updateUserPassword(userId: string, passwordHash: string): void {
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE auth_users SET password_hash = ?, updated_at = ?, password_changed_at = ? WHERE id = ?"
    )
    .run(passwordHash, now, now, userId);
}

export function createResetToken(userId: string): { token: string; expiresAt: number } {
  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + 60 * 60 * 1000;
  getDb()
    .prepare(
      `INSERT INTO auth_reset_tokens (id, user_id, token_hash, created_at, expires_at, used_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    )
    .run(`r_${now.toString(36)}_${randomToken(4)}`, userId, tokenHash, now, expiresAt);
  return { token, expiresAt };
}

export function consumeResetToken(token: string): { userId: string } | null {
  const tokenHash = hashToken(token);
  const row = getDb()
    .prepare(
      "SELECT id, user_id, expires_at, used_at FROM auth_reset_tokens WHERE token_hash = ?"
    )
    .get(tokenHash) as
    | { id: string; user_id: string; expires_at: number; used_at: number | null }
    | undefined;
  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at <= Date.now()) return null;
  getDb().prepare("UPDATE auth_reset_tokens SET used_at = ? WHERE id = ?").run(Date.now(), row.id);
  return { userId: row.user_id };
}
