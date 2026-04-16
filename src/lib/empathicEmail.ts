export type EmpathicTone = "warm" | "professional" | "formal";

export interface EmpathicEmailInput {
  recipientName: string;
  reason: string;
  message: string;
  tone: EmpathicTone;
}

export interface EmpathicEmailResult {
  subject: string;
  body: string;
}

function t(s: string): string {
  return s.trim();
}

function opening(tone: EmpathicTone): string {
  switch (tone) {
    case "warm":
      return "Espero que estés bien. Quería escribirte con calma; a veces estos mensajes merecen un espacio tranquilo.";
    case "professional":
      return "Espero encontrarte bien. Te escribo para compartirte la información con la claridad que merece.";
    case "formal":
      return "Por medio del presente me dirijo a usted para comunicarle lo siguiente.";
    default:
      return "";
  }
}

function bridge(tone: EmpathicTone): string {
  switch (tone) {
    case "warm":
      return "Lo que quiero que sepas es esto:";
    case "professional":
      return "En concreto:";
    case "formal":
      return "Detallo a continuación:";
    default:
      return "";
  }
}

function empathyClosing(tone: EmpathicTone, advisor: string): string {
  const a = advisor || "Tu asesor";
  switch (tone) {
    case "warm":
      return `Si algo no quedó claro o necesitas hablarlo, aquí estaré. Un abrazo,\n${a}`;
    case "professional":
      return `Quedo a tu disposición para cualquier duda o siguiente paso.\n\nSaludos cordiales,\n${a}`;
    case "formal":
      return `Quedo a la espera de sus comentarios.\n\nAtentamente,\n${a}`;
    default:
      return a;
  }
}

function salutation(recipientName: string, tone: EmpathicTone): string {
  const name = t(recipientName);
  if (tone === "formal") {
    return name ? `Estimada/o ${name}:` : "Estimada/o lector/a:";
  }
  return name ? `Hola ${name},` : "Hola,";
}

function subjectLine(input: EmpathicEmailInput, recipient: string): string {
  const reason = t(input.reason);
  const snippet = reason.length > 52 ? `${reason.slice(0, 49)}…` : reason;
  switch (input.tone) {
    case "warm":
      return recipient ? `Acompañándote con esto, ${recipient}` : "Acompañándote con esto";
    case "professional":
      return snippet || "Seguimiento";
    case "formal":
      return snippet || "Comunicación";
    default:
      return "Mensaje";
  }
}

/**
 * Arma un borrador de correo empático en español a partir de los datos del asesor.
 * Requiere al menos `situation` con texto; el resto admite valores por defecto suaves.
 */
export function buildEmpathicEmail(input: EmpathicEmailInput): EmpathicEmailResult | null {
  const reason = t(input.reason);
  const message = t(input.message);
  if (!reason || !message) return null;
  const recipient = t(input.recipientName);

  const parts: string[] = [];
  parts.push(salutation(input.recipientName, input.tone));
  parts.push("");
  parts.push(opening(input.tone));
  parts.push("");
  parts.push(`Motivo: ${reason}.`);
  parts.push("");
  parts.push(bridge(input.tone));
  parts.push("");
  parts.push(message);
  parts.push("");
  parts.push(empathyClosing(input.tone, "[tu nombre]"));

  const body = parts.join("\n");
  const subject = subjectLine(input, recipient);

  return { subject, body };
}

export function fullEmailText(result: EmpathicEmailResult): string {
  if (result.subject) {
    return `Asunto: ${result.subject}\n\n${result.body}`;
  }
  return result.body;
}
