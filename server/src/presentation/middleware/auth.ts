import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaUserRepository } from "../../data/repositories/UserRepository";
import type { AuthRequest } from "../../types";
import { logger } from "../../utils";

const PUBLIC_PATHS = ["/register", "/login"];

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (PUBLIC_PATHS.includes(req.path)) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
        if (req.path === "/login" || req.path === "/register") {
          return res.redirect("/dashboard");
        }
      } catch {}
    }
    return next();
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(401).json({ error: "Access token required" });
      }
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userRepo = new PrismaUserRepository();
    const user = await userRepo.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(403).json({ error: "Invalid token or inactive user" });
    }

    (req as AuthRequest).user = {
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || user.createdAt,
    };

    logger.info(`Authenticated ${user.role}: ${user.login}`);
    next();
  } catch (error: any) {
    logger.error(`Auth error: ${error.message}`);
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.redirect("/login");
  }
}
