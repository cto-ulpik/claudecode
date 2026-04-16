import type { EmpathicEmailInput, EmpathicEmailResult, EmpathicTone } from "./empathicEmail";

const OPENAI_PATH = "/openai-proxy/v1/chat/completions";

function toneDescription(tone: EmpathicTone): string {
  switch (tone) {
    case "warm":
      return "cálido y cercano, humano, sin ser informal de más";
    case "professional":
      return "profesional y cercano, claro y respetuoso";
    case "formal":
      return "formal (tratamiento de usted), adecuado para contextos institucionales";
    default:
      return tone;
  }
}

function buildUserPrompt(input: EmpathicEmailInput): string {
  const recipient = input.recipientName.trim() || "(sin nombre)";
  const reason = input.reason.trim();
  const message = input.message.trim();
  const tone = toneDescription(input.tone);

  return `Eres un experto en comunicación empática. Escribe un correo electrónico empático con las siguientes características:

Destinatario: ${recipient}
Motivo del correo: ${reason}
Lo que se desea transmitir: ${message}
Tono: ${tone}

El correo debe:

Comenzar con un saludo personalizado
Mostrar comprensión genuina y empatía real hacia la situación
Expresar claramente lo que se quiere transmitir, sin sonar forzado
Tener un cierre cálido y apropiado al tono
Ser auténtico, humano y evitar clichés vacíos
Tener una longitud adecuada (ni muy corto ni excesivamente largo)

Escribe SOLO el cuerpo del correo, sin explicaciones adicionales. Incluye asunto al inicio con el formato: "Asunto: ..."`;
}

function parseEmailText(raw: string): EmpathicEmailResult {
  const lines = raw.trim().split(/\r?\n/);
  const first = lines[0] ?? "";
  const match = first.match(/^Asunto:\s*(.+)$/i);
  const subject = match?.[1]?.trim() ?? "";
  const body = match ? lines.slice(1).join("\n").trim() : raw.trim();
  if (!body) throw new Error("La API devolvió un cuerpo vacío.");
  return { subject, body };
}

export async function generateEmpathicEmailWithOpenAI(
  input: EmpathicEmailInput,
  signal?: AbortSignal
): Promise<EmpathicEmailResult> {
  const res = await fetch(OPENAI_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un experto en comunicación empática en español." },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText.slice(0, 280) || `OpenAI HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Respuesta de la API sin contenido.");
  }

  return parseEmailText(raw);
}
