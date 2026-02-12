import { Request, Response } from "express";
import { AuthService } from "../../domain/services/AuthService";
import * as jwt from "jsonwebtoken";
import { PrismaUserRepository } from "../../data/repositories/UserRepository";
import { logger } from "../../utils";
import type { SafeUser } from "../../types";

// ✅ Правильная инициализация с DI
const userRepo = new PrismaUserRepository();
export const authService = new AuthService(userRepo);

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { login, password, email } = req.body;
      logger.info(`Register attempt for login: ${login}`);

      const user = await authService.register(login, password, email);
      res.status(201).json({ message: "User created", user });
    } catch (error: any) {
      logger.error(`Register error: ${error.message}`);
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { login, password } = req.body; // ✅ login ВМЕСТО email!
      logger.info(`Login attempt for login: ${login}`);

      const user = await authService.login(login, password);

      // ✅ JWT токен
      const token = jwt.sign(
        { userId: user.id, login: user.login },
        process.env.JWT_SECRET!,
      );

      res.json({
        message: "Login successful",
        user,
        token,
      });
    } catch (error: any) {
      logger.error(`Login error: ${error.message}`);
      res.status(401).json({ message: error.message });
    }
  }
}
