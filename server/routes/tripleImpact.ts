import { Router } from "express";

export const tripleImpactRouter = Router();

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 32000;
const MAX_REDES_CHARS = 12000;

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[…truncado…]`;
}

function buildPrompt(text: string, redes: string, redesUrls: string): string {
  const clipped = clip(text, MAX_INPUT_CHARS);
  const redesBlock = redes.trim()
    ? clip(redes.trim(), MAX_REDES_CHARS)
    : "(No se aportó contenido de redes. Marca hallazgos de contraste como [SUPUESTO] y lista qué habría que verificar en Instagram/LinkedIn/web.)";
  const urlsBlock = redesUrls.trim() || "(sin URLs)";

  return `Eres analista senior de Marcas que Impactan (MQI), una agencia ecuatoriana que comunica empresas de impacto positivo. Evalúas el brief o memoria de sostenibilidad de una empresa para decidir su nivel de madurez en Triple Impacto ANTES de tomar el proyecto, y preparas un briefing de entrevista para Nico (host / entrevistador de MQI).

REGLA MAESTRA — la vara es la distancia sobre el mínimo legal ecuatoriano, no la perfección:
- Cumplir EXACTAMENTE lo que la ley ya obliga (afiliación al IESS, décimos, cuota del 4% de inclusión, reglamento de seguridad y salud, estar al día con el SRI, reglamento interno de trabajo) equivale a ~40/100. NO es un diferencial; es el punto de partida.
- Cada práctica cuenta más cuanto más VERIFICABLE sea: cifras con línea base, metas con fecha, porcentajes, toneladas, montos, comités con actas, políticas escritas, auditorías, certificaciones, evaluación de proveedores. Afirmaciones vagas o declarativas suman poco: márcalas como no verificables.
- El 100 es casi inalcanzable: frontera de mejor práctica GLOBAL en las tres dimensiones con verificación externa.

ANCLAS DE CALIBRACIÓN:
- Memoria madura GRI+SASB, doble materialidad, datos año a año → 85–92.
- Brief con datos reales pero sin marco de reporte ni verificación externa → 60–72.
- Buenas intenciones, lenguaje declarativo, pocas cifras → 40–55.
- Solo cumple la ley, o ni eso → 25–40.
No infles la nota por tamaño o prestigio. Sé exigente pero justo con una pyme ecuatoriana.

CONTRASTE BRIEF vs REDES:
- Compara lo declarado en el brief con el material de redes/web aportado (bios, captions, about, posts).
- Separa evidencia dura (certificaciones, cifras, reportes) de storytelling.
- Si falta evidencia o no hay material de redes, antepone [SUPUESTO] al hallazgo.
- Señala contradicciones, omisiones o claims más fuertes en redes que en el brief (o viceversa).

BRIEF / DOCUMENTO:
"""
${clipped}
"""

URLs DE REDES / WEB (referencia):
${urlsBlock}

CONTENIDO PEGADO DE REDES / WEB (bios, captions, about, posts):
"""
${redesBlock}
"""

Responde ÚNICAMENTE con JSON válido en español, sin markdown ni backticks.
Reglas de formato:
- Sin saltos de línea reales dentro de strings; frases seguidas.
- Sin comillas dobles dentro de textos; usa comillas simples.
- Sin comas colgantes.
- Textos breves.

{
  "empresa_detectada": "nombre o vacío",
  "tipo_documento": "brief de respuestas | memoria de sostenibilidad | reporte | otro",
  "indice": 0,
  "confianza": "alta | media | baja",
  "dimensiones": {
    "social":    {"nota":0, "resumen":"2-3 frases", "fortalezas":["máx 3"], "vacios":["máx 3"]},
    "ambiental": {"nota":0, "resumen":"2-3 frases", "fortalezas":["máx 3"], "vacios":["máx 3"]},
    "economico": {"nota":0, "resumen":"2-3 frases", "fortalezas":["máx 3"], "vacios":["máx 3"]}
  },
  "veredicto": "3-4 frases para lectura interna MQI",
  "recomendada": "Sí | Sí, con acompañamiento | No por ahora",
  "alertas": [{"nivel":"alta|media","texto":"..."}],
  "recomendaciones": ["máx 5 acciones concretas"],
  "citas": [{"texto":"máx 20 palabras","lectura":"..."}],
  "redes_vs_brief": {
    "resumen": "2-4 frases del contraste brief vs redes/web",
    "alineaciones": ["máx 4: lo que coincide entre brief y redes"],
    "contradicciones": ["máx 4: más fuerte en redes que en brief, o al revés"],
    "solo_storytelling": ["máx 4: claims de redes o brief sin evidencia"],
    "verificar": ["máx 4: qué chequear aún en redes o en fuente primaria"],
    "material_redes": "aportado | no aportado"
  },
  "briefing_nico": {
    "ficha_rapida": {
      "empresa": "",
      "fundador": "nombre o [SUPUESTO]/desconocido",
      "sector": "",
      "tamano": "micro|pequeña|mediana|grande|desconocido",
      "tiempo_operando": "",
      "mercado": "Ecuador | exterior | ambos | desconocido"
    },
    "semaforo": {
      "planeta": "verde|amarillo|rojo",
      "personas": "verde|amarillo|rojo",
      "utilidad": "verde|amarillo|rojo",
      "justificacion": "exactamente 3 líneas cortas: planeta; personas; utilidad — basadas en criterios observables, no marketing"
    },
    "evidencia": ["máx 5 ítems comprobados: certificación, cifra, reporte"],
    "relato": ["máx 5 ítems de storytelling o [SUPUESTO] sin evidencia dura"],
    "gancho_entrevista": "1-2 líneas: por qué importa a la audiencia MQI y el ángulo poco contado",
    "preguntas_fuertes": ["3 a 5 preguntas que empujen a mostrar algo real, no el speech de siempre"],
    "riesgos_reputacionales": ["qué NO preguntar o mencionar en vivo si hay algo delicado; o 'ninguno evidente'"],
    "fit_marca": "cómo conecta con ejecución, triple impacto real, mipymes, Ecuador — para que la conversación se sienta de Nico/MQI",
    "recomendacion_final": "Avanzar | Avanzar con ajustes | No avanzar — más una línea de por qué"
  }
}`;
}

tripleImpactRouter.get("/health", (_req, res) => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  res.json({
    ok: true,
    service: "triple-impact",
    openaiConfigured: hasKey,
  });
});

tripleImpactRouter.post("/evaluate", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({
      error: "OPENAI_API_KEY no configurada en el servidor. Añádela al ecosystem y reinicia PM2.",
    });
    return;
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const redes = typeof req.body?.redes === "string" ? req.body.redes.trim() : "";
  const redesUrls = typeof req.body?.redesUrls === "string" ? req.body.redesUrls.trim() : "";

  if (text.length < 40) {
    res.status(400).json({ error: "El texto del brief es demasiado corto." });
    return;
  }
  if (text.length > 200_000) {
    res.status(400).json({ error: "El texto supera el límite permitido." });
    return;
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 6000,
        messages: [
          {
            role: "system",
            content:
              "Eres analista senior de Marcas que Impactan. Responde únicamente con JSON válido, sin markdown ni backticks.",
          },
          { role: "user", content: buildPrompt(text, redes, redesUrls) },
        ],
      }),
    });

    const raw = await response.text();
    let data: {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      /* ignore */
    }

    if (!response.ok) {
      const detail = data.error?.message || raw.slice(0, 280) || `HTTP ${response.status}`;
      console.warn("[triple-impact] OpenAI:", detail);
      res.status(502).json({ error: `La evaluación falló (${response.status}). ${detail}` });
      return;
    }

    const content = String(data.choices?.[0]?.message?.content || "").trim();
    if (!content) {
      res.status(502).json({ error: "El modelo no devolvió texto." });
      return;
    }

    res.json({ ok: true, content });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn("[triple-impact] evaluate:", detail);
    res.status(502).json({ error: `No se pudo contactar al modelo. ${detail}` });
  }
});
