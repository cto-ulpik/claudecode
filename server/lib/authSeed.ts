import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import { ALLOWED_USERS, INITIAL_PASSWORD, normalizeEmail } from "./authConfig.js";
import { hashPassword } from "./password.js";

export function ensureAuthTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      password_changed_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      user_agent TEXT,
      ip TEXT,
      FOREIGN KEY (user_id) REFERENCES auth_users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS auth_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES auth_users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_auth_reset_token ON auth_reset_tokens(token_hash);
  `);

  seedAllowedUsers(db);
}

function seedAllowedUsers(db: Database.Database): void {
  const existing = db.prepare("SELECT email FROM auth_users").all() as Array<{ email: string }>;
  const existingSet = new Set(existing.map((r) => r.email));
  const missing = ALLOWED_USERS.filter((u) => !existingSet.has(normalizeEmail(u.email)));
  const updateName = db.prepare(
    "UPDATE auth_users SET name = @name, updated_at = @updated_at WHERE email = @email"
  );
  const now = Date.now();

  const tx = db.transaction(() => {
    for (const user of ALLOWED_USERS) {
      const email = normalizeEmail(user.email);
      if (existingSet.has(email)) {
        updateName.run({ email, name: user.name, updated_at: now });
      }
    }
    if (missing.length === 0) return;
    const passwordHash = hashPassword(INITIAL_PASSWORD);
    const insert = db.prepare(`
      INSERT INTO auth_users (id, email, name, password_hash, created_at, updated_at, password_changed_at)
      VALUES (@id, @email, @name, @password_hash, @created_at, @updated_at, @password_changed_at)
    `);
    for (const user of missing) {
      insert.run({
        id: `u_${randomBytes(8).toString("hex")}`,
        email: normalizeEmail(user.email),
        name: user.name,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
        password_changed_at: now,
      });
    }
  });
  tx();
}
