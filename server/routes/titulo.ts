import { Router } from "express";
import { postToAppsScriptPostOnly } from "../lib/appsScriptPost.js";

export const tituloRouter = Router();

type TituloEmailBody = {
  to?: string;
  titular?: string;
  denominacion?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  pdfBase64?: string;
  pdfFilename?: string;
};

tituloRouter.post("/send-email", async (req, res) => {
  const input = req.body as TituloEmailBody;
  const to = input.to?.trim();
  const titular = input.titular?.trim();
  const denominacion = input.denominacion?.trim();
  const body = input.body?.trim();
  const pdfBase64 = input.pdfBase64?.trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    res.status(400).json({ error: "Correo del cliente inválido." });
    return;
  }
  if (!titular) {
    res.status(400).json({ error: "Falta el titular." });
    return;
  }
  if (!denominacion) {
    res.status(400).json({ error: "Falta la denominación." });
    return;
  }
  if (!body) {
    res.status(400).json({ error: "Falta el mensaje." });
    return;
  }
  if (!pdfBase64) {
    res.status(400).json({ error: "Falta el PDF del título." });
    return;
  }

  const payload: Record<string, unknown> = {
    action: "send-titulo",
    to,
    titular,
    denominacion,
    subject: input.subject?.trim() || "Está listo tu título 🎉",
    body,
    htmlBody: input.htmlBody?.trim() || undefined,
    pdfBase64,
    pdfFilename: input.pdfFilename?.trim() || "titulo-concesion.pdf",
  };
  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  try {
    const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
    if (!url) throw new Error("Webhook de Apps Script no configurado");
    await postToAppsScriptPostOnly(url, payload);
    res.json({ ok: true });
  } catch (err) {
    console.warn("[titulo] send-email:", err instanceof Error ? err.message : err);
    res.status(502).json({ error: err instanceof Error ? err.message : "No se pudo enviar el correo" });
  }
});
