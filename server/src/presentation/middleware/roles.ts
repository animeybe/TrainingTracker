import { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../types";

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (authReq.user.role !== "USER" && authReq.user.role !== "ADMIN") {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(403).json({ error: "User access required" });
    }
    return res.redirect("/");
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;

  if (!authReq.user || authReq.user.role !== "ADMIN") {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(403).json({ error: "Admin access required" });
    }
    return res.redirect("/");
  }

  next();
}

export function requireAnyRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !allowedRoles.includes(authReq.user.role)) {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(403).json({
          error: `Required role: ${allowedRoles.join(" or ")}`,
        });
      }
      return res.redirect("/");
    }
    next();
  };
}
