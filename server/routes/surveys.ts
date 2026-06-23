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

async function appendToGoogleSheet(entry: Record<string, unknown>): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
  if (!url) return;

  const payload: Record<string, unknown> = { ...entry };
  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google Sheets webhook HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  try {
    const data = JSON.parse(text) as { ok?: boolean; error?: string };
    if (data.ok === false) {
      throw new Error(data.error ?? "Google Sheets webhook rechazó la fila");
    }
  } catch (err) {
    if (err instanceof SyntaxError) return;
    throw err;
  }
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

surveysRouter.post("/", async (req, res) => {
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

  try {
    await appendToGoogleSheet(entry);
  } catch (err) {
    console.warn("[surveys] Google Sheets:", err instanceof Error ? err.message : err);
  }

  res.status(201).json({ id, createdAt: now });
});
