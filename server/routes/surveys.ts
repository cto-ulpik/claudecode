import { randomUUID } from "node:crypto";
import { Router } from "express";
import { postToAppsScript } from "../lib/appsScriptPost.js";
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

async function appendToGoogleSheet(entry: Record<string, unknown>): Promise<"ok" | "skipped"> {
  const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
  if (!url) return "skipped";

  const payload: Record<string, unknown> = { ...entry };
  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  const text = await postToAppsScript(url, payload);

  try {
    const data = JSON.parse(text) as { ok?: boolean; error?: string };
    if (data.ok === false) {
      throw new Error(data.error ?? "Google Sheets webhook rechazó la fila");
    }
    if (data.ok === true) return "ok";
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Apps Script respondió HTML/no JSON: ${text.slice(0, 120)}`);
    }
    throw err;
  }
  return "ok";
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

  let sheets: "ok" | "skipped" | "error" = "skipped";
  try {
    sheets = await appendToGoogleSheet(entry);
  } catch (err) {
    sheets = "error";
    console.warn("[surveys] Google Sheets:", err instanceof Error ? err.message : err);
  }

  res.status(201).json({ id, createdAt: now, sheets });
});
