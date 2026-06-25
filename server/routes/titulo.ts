import { Router } from "express";

export const tituloRouter = Router();

type TituloEmailBody = {
  to?: string;
  titular?: string;
  denominacion?: string;
  subject?: string;
  body?: string;
  pdfBase64?: string;
  pdfFilename?: string;
};

async function postTituloEmail(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
  if (!url) throw new Error("Webhook de Apps Script no configurado");

  const body = JSON.stringify(payload);
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (location) res = await fetch(location, { method: "GET", redirect: "follow" });
  }
  const text = await res.text();
  if (!text.trim().startsWith("{")) {
    throw new Error(`Apps Script no devolvió JSON: ${text.slice(0, 120)}`);
  }
  const data = JSON.parse(text) as { ok?: boolean; error?: string };
  if (data.ok === false) throw new Error(data.error ?? "Apps Script rechazó el envío");
  if (data.ok !== true) throw new Error("Respuesta inesperada de Apps Script");
}

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
    subject: input.subject?.trim() || `Tu título de concesión — ${denominacion}`,
    body,
    pdfBase64,
    pdfFilename: input.pdfFilename?.trim() || "titulo-concesion.pdf",
  };
  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  try {
    await postTituloEmail(payload);
    res.json({ ok: true });
  } catch (err) {
    console.warn("[titulo] send-email:", err instanceof Error ? err.message : err);
    res.status(502).json({ error: err instanceof Error ? err.message : "No se pudo enviar el correo" });
  }
});
