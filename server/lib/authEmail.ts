import { postToAppsScriptPostOnly } from "./appsScriptPost.js";

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
}): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_NPS_WEBAPP_URL?.trim();
  if (!url) {
    console.warn("[auth-email] GOOGLE_SHEETS_NPS_WEBAPP_URL no configurada; correo no enviado a", input.to);
    console.warn("[auth-email] subject:", input.subject);
    console.warn("[auth-email] body:", input.body);
    return;
  }

  const payload: Record<string, unknown> = {
    action: "send-auth-email",
    to: input.to,
    subject: input.subject,
    body: input.body,
    htmlBody: input.htmlBody || "",
  };
  const secret = process.env.GOOGLE_SHEETS_NPS_WEBHOOK_SECRET?.trim();
  if (secret) payload.token = secret;

  await postToAppsScriptPostOnly(url, payload);
}

export function appBaseUrl(reqHost?: string): string {
  const fromEnv = process.env.APP_BASE_URL?.trim() || process.env.PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (reqHost) return `https://${reqHost.replace(/:\d+$/, "")}`;
  return "https://ia.ulpik.com";
}
