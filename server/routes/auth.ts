import { Router } from "express";
import { isAllowedEmail, normalizeEmail } from "../lib/authConfig.js";
import { appBaseUrl, sendAuthEmail } from "../lib/authEmail.js";
import {
  consumeResetToken,
  createResetToken,
  createSession,
  findUserByEmail,
  findUserById,
  getSessionByToken,
  revokeAllSessionsForUser,
  revokeSessionByToken,
  updateUserPassword,
} from "../lib/authSessions.js";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "../lib/cookies.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

const MIN_PASSWORD_LEN = 8;

authRouter.post("/login", (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");

  if (!email || !password) {
    res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    return;
  }
  if (!isAllowedEmail(email)) {
    res.status(401).json({ error: "Correo o contraseña incorrectos" });
    return;
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "Correo o contraseña incorrectos" });
    return;
  }

  const { token, expiresAt } = createSession(user.id, req);
  setSessionCookie(res, token);
  res.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    expiresAt,
  });
});

authRouter.post("/logout", (req, res) => {
  const token = getSessionToken(req);
  if (token) revokeSessionByToken(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const session = getSessionByToken(token);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }
  res.json({
    ok: true,
    user: session.user,
    expiresAt: session.expiresAt,
  });
});

authRouter.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  if (newPassword.length < MIN_PASSWORD_LEN) {
    res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres` });
    return;
  }
  if (newPassword === currentPassword) {
    res.status(400).json({ error: "La nueva contraseña debe ser distinta a la actual" });
    return;
  }

  const full = findUserByEmail(user.email);
  if (!full || !verifyPassword(currentPassword, full.password_hash)) {
    res.status(401).json({ error: "Contraseña actual incorrecta" });
    return;
  }

  updateUserPassword(user.id, hashPassword(newPassword));
  revokeAllSessionsForUser(user.id);
  clearSessionCookie(res);
  res.json({ ok: true, message: "Contraseña actualizada. Inicia sesión de nuevo." });
});

authRouter.post("/forgot-password", async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  // Respuesta genérica para no filtrar si el correo existe.
  const generic = {
    ok: true,
    message: "Si el correo está autorizado, recibirás un enlace para renovar tu contraseña.",
  };

  if (!email || !isAllowedEmail(email)) {
    res.json(generic);
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    res.json(generic);
    return;
  }

  const { token } = createResetToken(user.id);
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const base = appBaseUrl(host);
  const resetUrl = `${base}/restablecer-contrasena?token=${encodeURIComponent(token)}`;

  try {
    await sendAuthEmail({
      to: user.email,
      subject: "Renueva tu contraseña — Ulpik IA",
      body:
        `Hola ${user.name},\n\n` +
        `Recibimos una solicitud para renovar tu contraseña de acceso a ia.ulpik.com.\n\n` +
        `Abre este enlace (válido 1 hora):\n${resetUrl}\n\n` +
        `Si no solicitaste este cambio, ignora este correo.\n\n— Ulpik`,
      htmlBody:
        `<p>Hola <strong>${escapeHtml(user.name)}</strong>,</p>` +
        `<p>Recibimos una solicitud para renovar tu contraseña de acceso a <strong>ia.ulpik.com</strong>.</p>` +
        `<p><a href="${resetUrl}">Renovar contraseña</a></p>` +
        `<p>El enlace es válido por <strong>1 hora</strong>.</p>` +
        `<p>Si no solicitaste este cambio, ignora este correo.</p>` +
        `<p>— Ulpik</p>`,
    });
  } catch (e) {
    console.warn("[auth] forgot-password email:", e instanceof Error ? e.message : e);
  }

  res.json(generic);
});

authRouter.post("/reset-password", (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.newPassword || "");
  if (!token) {
    res.status(400).json({ error: "Falta el token de renovación" });
    return;
  }
  if (newPassword.length < MIN_PASSWORD_LEN) {
    res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres` });
    return;
  }

  const consumed = consumeResetToken(token);
  if (!consumed) {
    res.status(400).json({ error: "El enlace no es válido o ya expiró. Solicita uno nuevo." });
    return;
  }

  const user = findUserById(consumed.userId);
  if (!user) {
    res.status(400).json({ error: "Usuario no encontrado" });
    return;
  }

  updateUserPassword(user.id, hashPassword(newPassword));
  revokeAllSessionsForUser(user.id);
  clearSessionCookie(res);
  res.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
