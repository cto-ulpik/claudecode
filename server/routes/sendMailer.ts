import { Router } from "express";
import { postToAppsScriptPostOnly } from "../lib/appsScriptPost.js";

export const sendMailerRouter = Router();

type ExtraAttachment = {
  filename?: string;
  mimeType?: string;
  base64?: string;
};

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
  extraAttachments?: ExtraAttachment[];
};

const STAGES = new Set([
  "busqueda",
  "inicio",
  "publicacion",
  "fin_gaceta",
  "resolucion",
  "titulo",
]);

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

function normalizeExtraAttachments(input: ExtraAttachment[] | undefined): Array<{
  filename: string;
  mimeType: string;
  base64: string;
}> {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => ({
      filename: item.filename?.trim() || `adjunto-${index + 1}`,
      mimeType: item.mimeType?.trim() || "application/octet-stream",
      base64: item.base64?.trim() || "",
    }))
    .filter((item) => item.base64.length > 0)
    .slice(0, 5);
}

sendMailerRouter.post("/send-email", async (req, res) => {
  const input = req.body as SendMailerBody;
  const to = input.to?.trim() ?? "";
  const stage = input.stage?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const pdfBase64 = input.pdfBase64?.trim() ?? "";
  const extraAttachments = normalizeExtraAttachments(input.extraAttachments);

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
    const text = await postToAppsScriptPostOnly(url, payload);
    const result = JSON.parse(text) as { ok?: boolean; error?: string };
    if (result.ok === false) throw new Error(result.error || "Apps Script rechazó el correo.");
    res.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[send-mailer] send-email:", detail);
    res.status(502).json({ error: describeAppsScriptFailure(detail) });
  }
});
