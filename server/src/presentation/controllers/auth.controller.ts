import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../../common/utils";
import { UserId } from "../../common/types/ids";
import {
  AuthRequest,
  AuthResponse,
  MeResponse,
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseDto,
} from "../types/auth.types";
import { UserService } from "../../domain/services/user.service";
import { ProfileService } from "../../domain/services/profile.service";
import { Role } from "../../common/types/enums.types";
import { PrismaUserRepository } from "../../data/repositories/prisma-user.repository";
import { Result } from "../../domain/common/result";

const userService = container.get("userService") as UserService;
const profileService = container.get("profileService") as ProfileService;

export const register = async (
  req: Request<{}, {}, RegisterRequestDto>,
  res: Response<AuthResponse>,
) => {
  logger.info("=== REGISTER START ===", { bodyKeys: Object.keys(req.body) });

  try {
    const { login, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const userResult = await userService.create({
      login: login.trim(),
      email: email?.trim() ?? null,
      password: hashedPassword,
      role: Role.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!Result.isOk(userResult)) {
      logger.error("User creation validation failed", {
        error: userResult.error.message,
      });
      return res.status(400).json({ error: userResult.error.message });
    }

    const user = userResult.value;

    const profileResult = await profileService.createEmptyProfile(user.id);
    if (!Result.isOk(profileResult)) {
      logger.warn(`Profile creation failed: ${profileResult.error.message}`);
    } else {
      logger.info("✅ Profile created", { userId: user.id.value });
    }

    const token = jwt.sign({ userId: user.id.value }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    logger.info("🎉 REGISTER SUCCESS", { userId: user.id.value });

    const response: AuthResponseDto = {
      userId: user.id.value,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    res.status(201).json({ data: response });
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

// login и getMe без изменений...
export const login = async (
  req: Request<{}, {}, LoginRequestDto>,
  res: Response<AuthResponse>,
) => {
  logger.info("=== LOGIN START ===");

  try {
    const { login, password } = req.body;
    const userRepo = container.get("userRepo") as PrismaUserRepository;

    const user = await userRepo.findByLogin(login);
    if (!user) {
      logger.warn("❌ User not found", { login: login.slice(0, 3) + "..." });
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const isPasswordValid = await bcrypt.compare(password, user._password);
    if (!isPasswordValid) {
      logger.warn("❌ Wrong password", { login: login.slice(0, 3) + "..." });
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const token = jwt.sign({ userId: user.id.value }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    logger.info("🎉 LOGIN SUCCESS", { userId: user.id.value });

    const response: AuthResponseDto = {
      userId: user.id.value,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    res.json({ data: response });
  } catch (error: any) {
    logger.error("💥 LOGIN ERROR", error);
    res.status(400).json({ error: "Login failed" });
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response<MeResponse>,
): Promise<void> => {
  try {
    const userService = container.get("userService") as UserService;
    const userResult = await userService.getById(UserId.create(req.userId!));

    if (!Result.isOk(userResult)) {
      res.status(404).json({ error: userResult.error.message });
      return;
    }

    const user = userResult.value;
    const response: AuthResponseDto = {
      userId: user.id.value,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token: req.headers.authorization?.replace("Bearer ", "") || "",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    res.json({ data: response });
  } catch (error: any) {
    logger.error(`getMe failed: ${error.message}`);
    res.status(500).json({ error: "Failed to get user info" });
  }
};

export const updateAccountController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    logger.info("🔥 updateAccountController START", {
      userId: req.userId,
      body: req.body,
    }); // ✅ ЛОГ 1

    const userId = req.userId;
    if (!userId) {
      logger.warn("❌ NO userId");
      return res.status(401).json({ error: "Не авторизован" });
    }

    const updateData = {
      login: req.body.login?.trim(),
      email: req.body.email?.trim(),
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    };

    logger.info("📤 Calling userService.updateAccount", { userId, updateData }); // ✅ ЛОГ 2

    const userService = container.get("userService") as UserService;
    const result = await userService.updateAccount(
      UserId.create(userId),
      updateData,
    );

    logger.info("✅ userService result", { isOk: Result.isOk(result) }); // ✅ ЛОГ 3

    if (!Result.isOk(result)) {
      logger.error("❌ Service error", { error: result.error.message });
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ message: "Аккаунт обновлен" });
  } catch (error: any) {
    logger.error("💥 updateAccountController ERROR:", error); // ✅ ЛОГ 4
    res
      .status(500)
      .json({ error: error.message || "Внутренняя ошибка сервера" });
  }
};
