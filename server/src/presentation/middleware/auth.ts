import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaUserRepository } from "../../data/repositories/UserRepository";
import type { SafeUser } from "../../types";
import { logger } from "../../utils";

interface AuthRequest extends Request {
  user?: SafeUser;
  userId?: string;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const userRepo = new PrismaUserRepository();

    // ✅ Типизированный JWT decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      login: string;
    };

    const user = await userRepo.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ error: "Invalid token" });
    }

    // ✅ НОВЫЕ ПОЛЯ: login вместо name, email | null
    req.userId = user.id;
    req.user = {
      id: user.id,
      login: user.login, // ✅ login вместо name
      email: user.email, // ✅ string | null
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || user.createdAt,
    };

    logger.info(`Authenticated user: ${user.login}`);
    next();
  } catch (error: any) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(403).json({ error: "Invalid token", details: error.message });
  }
}
