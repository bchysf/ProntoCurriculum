import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import {
  clearSession,
  getSessionId,
  getSession,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && now > session.expires_at) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = session.user;
  next();
}

// Comma-separated allowlist; defaults to the site owner.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jelspexar10@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isAdminEmail(req.user?.email)) {
    res.status(403).json({ error: "Accesso riservato all'amministratore." });
    return;
  }
  next();
}
