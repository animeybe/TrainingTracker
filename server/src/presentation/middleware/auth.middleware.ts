import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../../common/utils";

const PUBLIC_PATHS = ["/api/auth/register", "/api/auth/login"];

interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (PUBLIC_PATHS.some((path) => req.path.includes(path))) return next();

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Access token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    logger.info(`JWT decoded: userId=${decoded.userId}`);

    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error: any) {
    logger.error(`Auth error: ${error.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
}
