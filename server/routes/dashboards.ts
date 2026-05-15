import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getDb, rowToClient, type DashboardRow } from "../db.js";

export const dashboardRouter = Router();

function parseBody(body: unknown): { name: string; category: string; html: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.name !== "string" || typeof o.category !== "string" || typeof o.html !== "string") {
    return null;
  }
  const name = o.name.trim();
  const category = o.category.trim();
  const html = o.html;
  if (!name || !category || !html.trim()) return null;
  return { name, category, html };
}

dashboardRouter.get("/", (_req, res) => {
  const rows = getDb()
    .prepare("SELECT * FROM dashboards ORDER BY created_at DESC")
    .all() as DashboardRow[];
  res.json(rows.map(rowToClient));
});

dashboardRouter.get("/:id", (req, res) => {
  const row = getDb().prepare("SELECT * FROM dashboards WHERE id = ?").get(req.params.id) as
    | DashboardRow
    | undefined;
  if (!row) {
    res.status(404).json({ error: "Dashboard no encontrado." });
    return;
  }
  res.json(rowToClient(row));
});

dashboardRouter.post("/", (req, res) => {
  const input = parseBody(req.body);
  if (!input) {
    res.status(400).json({ error: "Nombre, categoría y HTML son obligatorios." });
    return;
  }
  const now = Date.now();
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO dashboards (id, name, category, html, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, input.name, input.category, input.html, now, now);
  const row = getDb().prepare("SELECT * FROM dashboards WHERE id = ?").get(id) as DashboardRow;
  res.status(201).json(rowToClient(row));
});

dashboardRouter.put("/:id", (req, res) => {
  const input = parseBody(req.body);
  if (!input) {
    res.status(400).json({ error: "Nombre, categoría y HTML son obligatorios." });
    return;
  }
  const existing = getDb().prepare("SELECT * FROM dashboards WHERE id = ?").get(req.params.id) as
    | DashboardRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Dashboard no encontrado." });
    return;
  }
  const now = Date.now();
  getDb()
    .prepare(
      `UPDATE dashboards SET name = ?, category = ?, html = ?, updated_at = ? WHERE id = ?`,
    )
    .run(input.name, input.category, input.html, now, req.params.id);
  const row = getDb().prepare("SELECT * FROM dashboards WHERE id = ?").get(req.params.id) as DashboardRow;
  res.json(rowToClient(row));
});

dashboardRouter.delete("/:id", (req, res) => {
  const result = getDb().prepare("DELETE FROM dashboards WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Dashboard no encontrado." });
    return;
  }
  res.status(204).send();
});
