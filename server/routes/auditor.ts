import { Router } from "express";

/**
 * Auditor de Trámites SENADI (/auditor).
 * Recibe system + bloques de contenido (formato Anthropic: text | image base64)
 * y responde con el texto del modelo. Usa Claude si hay ANTHROPIC_API_KEY;
 * si no, cae a OpenAI con OPENAI_API_KEY.
 */
export const auditorRouter = Router();

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 4000;
const MAX_SYSTEM_CHARS = 60_000;
const MAX_TEXT_CHARS = 200_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

function parseBlocks(input: unknown): Block[] | string {
  if (!Array.isArray(input) || input.length === 0) return "Faltan bloques de contenido.";
  const blocks: Block[] = [];
  let textChars = 0;
  for (const raw of input) {
    const b = raw as Record<string, unknown>;
    if (b?.type === "text" && typeof b.text === "string") {
      textChars += b.text.length;
      blocks.push({ type: "text", text: b.text });
    } else if (b?.type === "image") {
      const src = b.source as Record<string, unknown> | undefined;
      const mediaType = typeof src?.media_type === "string" ? src.media_type : "";
      const data = typeof src?.data === "string" ? src.data : "";
      if (!ALLOWED_IMAGE_TYPES.has(mediaType) || !data) {
        return "Imagen no válida. Usa PNG, JPG, GIF o WEBP.";
      }
      blocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
    } else {
      return "Bloque de contenido no reconocido.";
    }
  }
  if (textChars > MAX_TEXT_CHARS) return "El texto de los documentos supera el límite permitido.";
  return blocks;
}

async function callAnthropic(apiKey: string, system: string, blocks: Block[]): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: blocks }],
    }),
  });
  const raw = await response.text();
  let data: { content?: Array<{ type?: string; text?: string }>; error?: { message?: string } } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    /* ignore */
  }
  if (!response.ok) {
    throw new Error(`Claude (${response.status}): ${data.error?.message || raw.slice(0, 280)}`);
  }
  return (data.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("\n");
}

async function callOpenAI(apiKey: string, system: string, blocks: Block[]): Promise<string> {
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const content = blocks.map((b) =>
    b.type === "text"
      ? { type: "text", text: b.text }
      : { type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } },
  );
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  const raw = await response.text();
  let data: { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    /* ignore */
  }
  if (!response.ok) {
    throw new Error(`OpenAI (${response.status}): ${data.error?.message || raw.slice(0, 280)}`);
  }
  return String(data.choices?.[0]?.message?.content || "");
}

auditorRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "auditor-senadi",
    provider: process.env.ANTHROPIC_API_KEY?.trim()
      ? "anthropic"
      : process.env.OPENAI_API_KEY?.trim()
        ? "openai"
        : null,
  });
});

auditorRouter.post("/ai", async (req, res) => {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!anthropicKey && !openaiKey) {
    res.status(503).json({
      error: "Ni ANTHROPIC_API_KEY ni OPENAI_API_KEY están configuradas en el servidor.",
    });
    return;
  }

  const system = typeof req.body?.system === "string" ? req.body.system : "";
  if (!system.trim() || system.length > MAX_SYSTEM_CHARS) {
    res.status(400).json({ error: "Instrucciones del sistema vacías o demasiado largas." });
    return;
  }
  const blocks = parseBlocks(req.body?.content);
  if (typeof blocks === "string") {
    res.status(400).json({ error: blocks });
    return;
  }

  try {
    const text = anthropicKey
      ? await callAnthropic(anthropicKey, system, blocks)
      : await callOpenAI(openaiKey as string, system, blocks);
    if (!text.trim()) {
      res.status(502).json({ error: "El modelo no devolvió texto." });
      return;
    }
    res.json({ ok: true, text });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn("[auditor] ai:", detail);
    res.status(502).json({ error: `No se pudo completar la consulta. ${detail}` });
  }
});
