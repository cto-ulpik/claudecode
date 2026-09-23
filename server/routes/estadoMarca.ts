import type { Request, Response, NextFunction } from "express";
import { Router } from "express";

export const estadoMarcaRouter = Router();

function brandsApiBase(): string {
  return (
    process.env.BRANDS_API_BASE_URL?.trim() ||
    process.env.BRANDS_MANAGER_URL?.trim() ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

async function proxyGet(path: string, res: Response): Promise<void> {
  const url = `${brandsApiBase()}${path}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* keep text */
    }
    res.status(response.status).json(data);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn("[estado-marca] proxy:", url, detail);
    res.status(502).json({
      ok: false,
      message: `No se pudo contactar la API de marcas (${brandsApiBase()}). ${detail}`,
    });
  }
}

export async function proxyBrandByUpk(req: Request, res: Response, _next?: NextFunction) {
  const code = String(req.params.code || req.params.upkCode || "").trim();
  if (!code) {
    res.status(400).json({ ok: false, message: "Falta código UPK" });
    return;
  }
  await proxyGet(`/api/brand/upk/${encodeURIComponent(code)}`, res);
}

export async function proxyBrandsByDni(req: Request, res: Response, _next?: NextFunction) {
  const dni = String(req.params.dni || "").trim();
  if (!dni || dni.length < 5) {
    res.status(400).json({ ok: false, message: "DNI / CI / RUC inválido" });
    return;
  }
  await proxyGet(`/api/brands/dni/${encodeURIComponent(dni)}`, res);
}

estadoMarcaRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "estado-marca-proxy", brandsApi: brandsApiBase() });
});

estadoMarcaRouter.get("/upk/:code", proxyBrandByUpk);
estadoMarcaRouter.get("/dni/:dni", proxyBrandsByDni);
