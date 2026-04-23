import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.log("🚫 No token → 401");
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error: unknown) {
    console.error("💥 Auth ERROR:", (error as Error).message);
    res.status(401).json({ error: "Invalid token" });
  }
}
