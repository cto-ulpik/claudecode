import type { NextFunction, Request, Response } from "express";
import { getSessionByToken, type AuthUser } from "../lib/authSessions.js";
import { getSessionToken } from "../lib/cookies.js";

export type AuthedRequest = Request & { authUser?: AuthUser; authSessionId?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const session = getSessionByToken(token);
  if (!session) {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }
  req.authUser = session.user;
  req.authSessionId = session.id;
  next();
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = getSessionToken(req);
  if (token) {
    const session = getSessionByToken(token);
    if (session) {
      req.authUser = session.user;
      req.authSessionId = session.id;
    }
  }
  next();
}
