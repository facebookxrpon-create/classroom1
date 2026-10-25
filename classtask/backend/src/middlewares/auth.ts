// backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).passport?.user;
  if (!userId) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  // attach to request for later use
  (req as any).userId = userId;
  next();
}
