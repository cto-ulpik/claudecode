import { Router } from "express";
import { postToAppsScript } from "../lib/appsScriptPost.js";

export const compraRouter = Router();

type CompraBody = {
  email?: string;
  servicio?: string;
  facilidad?: number;
  claridad?: number;
  dificultad?: string;
  atencion?: number;
  acomp?: string;
  nps?: number;
  asesor?: string;
  mejora?: string;
  ts?: string;
};

function validate(body: CompraBody): string | null {
  const email = body.email?.trim() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Correo inválido";
  if (!body.servicio?.trim()) return "Falta servicio";
  if (!body.facilidad || body.facilidad < 1 || body.facilidad > 10) return "Falta facilidad";
  if (!body.claridad || body.claridad < 1 || body.claridad > 10) return "Falta claridad";
  if (!body.dificultad?.trim()) return "Falta dificultad";
  if (!body.atencion || body.atencion < 1 || body.atencion > 10) return "Falta atención";
  if (!body.acomp?.trim()) return "Falta acompañamiento";
  if (!body.nps || body.nps < 1 || body.nps > 10) return "Falta recomendación";
  if (!body.asesor?.trim()) return "Falta asesor";
  if ((body.mejora?.trim().length ?? 0) < 5) return "Falta comentario de mejora";
  return null;
}

compraRouter.post("/", async (req, res) => {
  const input = req.body as CompraBody;
  const err = validate(input);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const payload: Record<string, unknown> = {
    action: "append-compra",
    email: input.email!.trim(),
    servicio: input.servicio!.trim(),
    facilidad: input.facilidad,
    claridad: input.claridad,
    dificultad: input.dificultad!.trim(),
    atencion: input.atencion,
    acomp: input.acomp!.trim(),
    nps: input.nps,
    asesor: input.asesor!.trim(),
    mejora: input.mejora!.trim(),
    ts: input.ts,
  };

  const secret = process.env.GOOGLE_SHEETS_COMPRA_WEBHOOK_SECRET?.trim();
  if (secret) payload.secret = secret;

  const url = process.env.GOOGLE_SHEETS_COMPRA_WEBAPP_URL?.trim();
  if (!url) {
    res.status(503).json({ error: "Webhook de encuesta compra no configurado" });
    return;
  }

  try {
    const text = await postToAppsScript(url, payload);
    const data = JSON.parse(text) as { ok?: boolean; error?: string; row?: unknown; message?: string };
    if (data.ok === false) {
      throw new Error(data.error ?? "Google Sheets rechazó la fila");
    }
    if (!data.row) {
      throw new Error(
        "Apps Script no escribió en el Sheet. Redespliega Code.gs como aplicación web (Ejecutar como: Yo, acceso: Cualquier persona)."
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.warn("[compra] append:", e instanceof Error ? e.message : e);
    res.status(502).json({ error: e instanceof Error ? e.message : "No se pudo guardar en Google Sheets" });
  }
});
