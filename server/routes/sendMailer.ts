import { Router } from "express";
import { postToAppsScriptPostOnly } from "../lib/appsScriptPost.js";

export const sendMailerRouter = Router();

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
};

const STAGES = new Set([
  "busqueda",
  "inicio",
  "publicacion",
  "fin_gaceta",
  "resolucion",
  "titulo",
]);

function bodyToSafeHtml(body: string): string {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

sendMailerRouter.post("/send-email", async (req, res) => {
  const input = req.body as SendMailerBody;
  const to = input.to?.trim() ?? "";
  const stage = input.stage?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const pdfBase64 = input.pdfBase64?.trim() ?? "";
  const advisor = input.fields?.asesor?.trim() ?? "";

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
  if (!advisor) {
    res.status(400).json({ error: "No se pudo identificar el asesor en el PDF." });
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
    console.warn("[send-mailer] send-email:", error instanceof Error ? error.message : error);
    res.status(502).json({
      error: error instanceof Error ? error.message : "No se pudo enviar el correo.",
    });
  }
});
