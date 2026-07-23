import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  id: string;
  username: string;
  role: "ADMINISTRATOR" | "EMPLOYEE";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMINISTRATOR") {
    return res.status(403).json({ error: "Réservé à l'administrateur." });
  }
  next();
}

/** Only administrators can permanently delete records; employees can create/edit. */
export function requireDeletePermission(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMINISTRATOR") {
    return res.status(403).json({ error: "Seul l'administrateur peut supprimer un enregistrement." });
  }
  next();
}
