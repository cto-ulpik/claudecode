import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getDb } from "../db.js";

export const surveysRouter = Router();

type SurveyRow = { id: string; data: string; created_at: number };

function parseEntry(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.email !== "string" || typeof o.asesor !== "string") return null;
  if (typeof o.nps !== "number") return null;
  return o;
}

surveysRouter.get("/", (_req, res) => {
  const rows = getDb()
    .prepare("SELECT data FROM survey_responses ORDER BY created_at ASC")
    .all() as SurveyRow[];
  const list = rows
    .map((row) => {
      try {
        return JSON.parse(row.data) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((x): x is Record<string, unknown> => x !== null);
  res.json(list);
});

surveysRouter.post("/", (req, res) => {
  const entry = parseEntry(req.body);
  if (!entry) {
    res.status(400).json({ error: "Datos de encuesta incompletos." });
    return;
  }
  const id = randomUUID();
  const now = Date.now();
  getDb()
    .prepare("INSERT INTO survey_responses (id, data, created_at) VALUES (?, ?, ?)")
    .run(id, JSON.stringify(entry), now);
  res.status(201).json({ id, createdAt: now });
});
