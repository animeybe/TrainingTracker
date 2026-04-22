// controllers/auth.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../../common/utils";
import {
  AuthRequest,
  AuthResponse,
  MeResponse,
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseDto,
} from "../types/auth.types";
import { Result } from "../../domain/common/result";
import type { UserService } from "../../domain/services";
import type { UserProfileService } from "../../domain/services";

// ✅ Типизированное получение сервисов
const userService = container.get(ServiceKeys.USER_SERVICE) as UserService;
const profileService = container.get(
  ServiceKeys.PROFILE_SERVICE,
) as UserProfileService;

// Вспомогательный метод: создание "пустого" профиля
async function createEmptyProfile(userId: string): Promise<Result<any> | null> {
  const profileData = {
    id: userId,
    userId,
    weight: null,
    height: null,
    gender: null,
    age: null,
    lifestyle: null,
    goal: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const profile = await profileService.createProfile(profileData);
    return Result.ok(profile);
  } catch (error: any) {
    return Result.error(error);
  }
}

export const register = async (
  req: Request<{}, {}, RegisterRequestDto>,
  res: Response<AuthResponse>,
) => {
  logger.info("=== REGISTER START ===", { bodyKeys: Object.keys(req.body) });

  try {
    const { login, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userService.createUser({
      login: login.trim(),
      email: email?.trim() ?? null,
      passwordHash: hashedPassword,
      role: "USER",
      isActive: true,
    });

    if (!user) {
      logger.error("User creation validation failed");
      return res.status(400).json({ error: "Ошибка регистрации" });
    }

    const profileResult = await createEmptyProfile(user.id);

    if (!profileResult || !profileResult.isOk) {
      logger.warn(`Profile creation failed: ${profileResult?.error?.message}`);
    } else {
      logger.info("✅ Profile created", { userId: user.id });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    logger.info("🎉 REGISTER SUCCESS", { userId: user.id });

    const response: AuthResponseDto = {
      userId: user.id,
      login: user.login,
      email: user.email || null,
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

export const login = async (
  req: Request<{}, {}, LoginRequestDto>,
  res: Response<AuthResponse>,
) => {
  logger.info("=== LOGIN START ===");

  try {
    const { login: loginInput, password } = req.body;

    const user = await userService.findByLogin(loginInput);

    if (!user) {
      logger.warn("❌ User not found", {
        login: loginInput.slice(0, 3) + "...",
      });
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn("❌ Wrong password", {
        login: loginInput.slice(0, 3) + "...",
      });
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    logger.info("🎉 LOGIN SUCCESS", { userId: user.id });

    const response: AuthResponseDto = {
      userId: user.id,
      login: user.login,
      email: user.email || null,
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
    const user = await userService.findById(req.userId!);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const response: AuthResponseDto = {
      userId: user.id,
      login: user.login,
      email: user.email || null,
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
    });

    const userId = req.userId;
    if (!userId) {
      logger.warn("❌ NO userId");
      return res.status(401).json({ error: "Не авторизован" });
    }

    const updateData = {
      login: req.body.login?.trim(),
      email: req.body.email?.trim(),
    };

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      logger.error("❌ Service error: user update failed");
      return res.status(400).json({ error: "Ошибка обновления" });
    }

    res.json({ message: "Аккаунт обновлён" });
  } catch (error: any) {
    logger.error("💥 updateAccountController ERROR:", error);
    res
      .status(500)
      .json({ error: error.message || "Внутренняя ошибка сервера" });
  }
};
