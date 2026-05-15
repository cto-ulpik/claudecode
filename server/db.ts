import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, "..", "data", "dashboards.db");

export const DB_PATH = process.env.DASHBOARDS_DB_PATH?.trim() || defaultDbPath;

export type DashboardRow = {
  id: string;
  name: string;
  category: string;
  html: string;
  created_at: number;
  updated_at: number;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      html TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dashboards_category ON dashboards(category);
    CREATE INDEX IF NOT EXISTS idx_dashboards_created ON dashboards(created_at DESC);
  `);
  return db;
}

export function rowToClient(row: DashboardRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    html: row.html,
    createdAt: row.created_at,
  };
}
