import { Request, Response } from "express";
import { container } from "../../di/container";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../../common/utils";
import { Role } from "@prisma/client";

const userService = container.get("userService");

export const register = async (
  req: Request<{}, {}, { login: string; email?: string; password: string }>,
  res: Response,
) => {
  logger.info("=== REGISTER START ===", { bodyKeys: Object.keys(req.body) });

  try {
    const { login, email, password } = req.body;

    logger.info("📥 Body OK", {
      login: login?.slice(0, 3) + "...",
      email: !!email,
    });

    const hashedPassword = await bcrypt.hash(password, 12);
    logger.info("✅ Password hashed");

    const user = await userService.create({
      login: login.trim(),
      email: email?.trim() || null,
      password: hashedPassword,
      role: Role.USER,
      isActive: true,
    });

    const token = jwt.sign({ userId: user.id.value }, process.env.JWT_SECRET!);

    logger.info("🎉 REGISTER SUCCESS", { userId: user.id.value });

    res.status(201).json({
      userId: user.id.value,
      login: user.login,
      token,
    });
  } catch (error: any) {
    logger.error("💥 REGISTER ERROR", {
      error: error.message,
      code: error.code,
    });

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Логин уже занят" });
    }

    res.status(400).json({ error: error.message || "Registration failed" });
  }
};

export const login = async (
  req: Request<{}, {}, { login: string; password: string }>,
  res: Response,
) => {
  logger.info("=== LOGIN START ===");

  try {
    const { login, password } = req.body;
    const userRepo = container.get("userRepo");
    const user = await userRepo.findByLogin(login);

    if (!user) {
      logger.warn("❌ User not found", { login });
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const storedHash = user._password;
    const isPasswordValid = await bcrypt.compare(password, storedHash);

    logger.info("🔍 Password check", { isValid: isPasswordValid });

    // ВРЕМЕННО — без bcrypt (добавь позже)
    if (!isPasswordValid) {
      logger.warn("❌ Wrong password");
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const token = jwt.sign({ userId: user.id.value }, process.env.JWT_SECRET!);

    logger.info("🎉 LOGIN SUCCESS");
    res.json({ userId: user.id.value, login: user.login, token });
  } catch (error: any) {
    logger.error("💥 LOGIN ERROR", error);
    res.status(400).json({ error: "Login failed" });
  }
};
