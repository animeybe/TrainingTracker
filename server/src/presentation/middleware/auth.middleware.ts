import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../../domain";
import { container } from "../../di/container";
import { UserId } from "../../common/types/ids";
import { logger } from "../../common/utils";

interface AuthRequest extends Request {
  user?: {
    id: string;
    login: string;
    role: string;
  };
}

const PUBLIC_PATHS = ["/api/auth/register", "/api/auth/login"];

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // Публичные пути
    if (PUBLIC_PATHS.some((path) => req.path.includes(path))) {
      return next();
    }

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };
    const userService = container.get("userService") as UserService;
    const user = await userService.getById(UserId.create(decoded.userId));

    req.user = {
      id: user.id.value,
      login: user.login,
      role: user.role,
    };

    logger.info(`Authenticated: ${user.login}`);
    next();
  } catch (error: any) {
    logger.error(`Auth error: ${error.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
}
