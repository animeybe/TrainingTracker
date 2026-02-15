import { Request, Response } from "express";
import { ProfileService } from "../../domain";
import { UserService } from "../../domain";
import { container } from "../../di/container";
import {
  ProfileUpdateRequestDto,
  ProfileResponseDto,
} from "../types/profile.types";
import { UserId } from "../../common/types/ids";
import { logger } from "../../common/utils";

const profileService = container.get("profileService") as ProfileService;
const userService = container.get("userService") as UserService;

export class ProfileController {
  static async getProfile(
    req: Request,
    res: Response<ProfileResponseDto | { error: string }>,
  ) {
    logger.info("👤 ProfileController.getProfile()", {
      userId: (req as any).user?.id?.slice(0, 8),
    });

    try {
      const userId = UserId.create((req as any).user.id);

      const [profile, user] = await Promise.all([
        profileService.getOrCreate(userId),
        userService.getById(userId),
      ]);

      const response: ProfileResponseDto = {
        id: profile.userId.value,
        userId: profile.userId.value,
        login: user.login,
        role: user.role,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
        bmi: profile.calculateBMI(),
        bmiCategory: profile.getBMICategory(),
      };

      logger.info("✅ ProfileController success", {
        login: user.login,
        weight: profile.weight,
      });

      res.json(response);
    } catch (error: any) {
      logger.error(`ProfileController.getProfile failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  static async updateProfile(
    req: Request<{}, {}, ProfileUpdateRequestDto>,
    res: Response<ProfileResponseDto | { error: string }>,
  ) {
    logger.info("👤 ProfileController.updateProfile()");

    try {
      const userId = UserId.create((req as any).user.id);
      const profileRepo = container.get("profileRepo");
      const profile = await profileRepo.update(userId, req.body);

      // Загружаем обновленные user данные
      const user = await userService.getById(userId);

      const response: ProfileResponseDto = {
        id: profile.userId.value,
        userId: profile.userId.value,
        login: user.login,
        role: user.role,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
        bmi: profile.calculateBMI(),
        bmiCategory: profile.getBMICategory(),
      };

      logger.info("✅ ProfileController update success");
      res.json(response);
    } catch (error: any) {
      logger.error(`ProfileController.updateProfile failed: ${error.message}`);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}
