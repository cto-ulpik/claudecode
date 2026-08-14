import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postToAppsScriptPostOnly } from "../lib/appsScriptPost.js";

export const sendMailerRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

type SendMailerBody = {
  to?: string;
  stage?: string;
  variant?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  pdfBase64?: string;
  pdfFilename?: string;
  fields?: Record<string, string>;
  attachGarantia?: boolean;
  attachCronologia?: boolean;
};

type ExtraAttachment = {
  filename: string;
  mimeType: string;
  base64: string;
};

const STAGES = new Set([
  "busqueda",
  "inicio",
  "publicacion",
  "fin_gaceta",
  "resolucion",
  "titulo",
]);

const STATIC_ATTACHMENTS = {
  garantia: {
    filename: "garantia.jpg",
    mimeType: "image/jpeg",
    relativePaths: [
      path.join("public", "send-mailer", "img", "garantia.jpg"),
      path.join("dist", "send-mailer", "img", "garantia.jpg"),
    ],
  },
  cronologia: {
    filename: "cronologia.jpg",
    mimeType: "image/jpeg",
    relativePaths: [
      path.join("public", "send-mailer", "img", "cronologia.jpg"),
      path.join("dist", "send-mailer", "img", "cronologia.jpg"),
    ],
  },
} as const;

/**
 * El Apps Script antiguo no conoce `send-stage-email` y valida el payload como
 * encuesta, así que su error genérico se traduce a la acción que falta hacer.
 */
function describeAppsScriptFailure(detail: string): string {
  if (/Falta (?:email|calificaci)/i.test(detail)) {
    return "El Apps Script desplegado no reconoce la acción send-stage-email: publica una Nueva versión del Code.gs actualizado.";
  }
  if (/HTTP 40[0-9]|No se pudo abrir el archivo|no se encontr/i.test(detail)) {
    return `No se pudo contactar el Apps Script (revisa GOOGLE_SHEETS_NPS_WEBAPP_URL). Detalle: ${detail}`;
  }
  return detail || "No se pudo enviar el correo.";
}

function bodyToSafeHtml(body: string): string {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function loadStaticAttachment(
  key: keyof typeof STATIC_ATTACHMENTS,
): ExtraAttachment {
  const def = STATIC_ATTACHMENTS[key];
  for (const relative of def.relativePaths) {
    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute)) continue;
    const base64 = fs.readFileSync(absolute).toString("base64");
    if (!base64) continue;
    return {
      filename: def.filename,
      mimeType: def.mimeType,
      base64,
    };
  }
  throw new Error(`No se encontró el archivo de adjunto: ${def.filename}`);
}

function collectExtraAttachments(input: SendMailerBody): ExtraAttachment[] {
  const extras: ExtraAttachment[] = [];
  if (input.attachGarantia) extras.push(loadStaticAttachment("garantia"));
  if (input.attachCronologia) extras.push(loadStaticAttachment("cronologia"));
  return extras;
}

sendMailerRouter.post("/send-email", async (req, res) => {
  const input = req.body as SendMailerBody;
  const to = input.to?.trim() ?? "";
  const stage = input.stage?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const pdfBase64 = input.pdfBase64?.trim() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    res.status(400).json({ error: "Correo destinatario inválido." });
    return;
  }
  if (!STAGES.has(stage)) {
    res.status(400).json({ error: "Etapa de trámite inválida." });
    return;
  }
  if (stage === "fin_gaceta" && !["sin", "con"].includes(input.variant ?? "")) {
    res.status(400).json({ error: "Selecciona si la Gaceta terminó con o sin oposición." });
    return;
  }
  if (!subject || !body) {
    res.status(400).json({ error: "Falta asunto o contenido del correo." });
    return;
  }
  if (!pdfBase64) {
    res.status(400).json({ error: "Falta el PDF adjunto." });
    return;
  }

  let extraAttachments: ExtraAttachment[] = [];
  try {
    extraAttachments = collectExtraAttachments(input);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "No se pudieron cargar los adjuntos.",
    });
    return;
  }

  const payload: Record<string, unknown> = {
    action: "send-stage-email",
    to,
    stage,
    variant: input.variant?.trim() || "",
    subject,
    body,
    htmlBody: bodyToSafeHtml(body),
    pdfBase64,
    pdfFilename: input.pdfFilename?.trim() || "documento-senadi.pdf",
    extraAttachments,
    fields: input.fields ?? {},
  };

  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  try {
    const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
    if (!url) throw new Error("Webhook de Apps Script no configurado.");
    console.log(
      `[send-mailer] enviando a ${to} etapa=${stage} extras=${extraAttachments.map((a) => a.filename).join(",") || "(ninguno)"}`,
    );
    const text = await postToAppsScriptPostOnly(url, payload);
    const result = JSON.parse(text) as {
      ok?: boolean;
      error?: string;
      attachments?: number;
      version?: string;
    };
    if (result.ok === false) throw new Error(result.error || "Apps Script rechazó el correo.");
    res.json({
      ok: true,
      attachments: Number(result.attachments) || 1 + extraAttachments.length,
      extras: extraAttachments.map((item) => item.filename),
      version: result.version || "",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[send-mailer] send-email:", detail);
    res.status(502).json({ error: describeAppsScriptFailure(detail) });
  }
});
