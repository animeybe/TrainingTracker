import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import { ProfileService } from "../../domain/services/profile.service";
import {
  ProfileUpdateRequestDto,
  ProfileResponseDto,
  ProfileResponse,
} from "../types/profile.types";
import { AuthRequest } from "../types/auth.types";
import { UserId } from "../../common/types/ids";
import { logger } from "../../common/utils";

const profileService = container.get("profileService") as ProfileService;

export class ProfileController {
  static async getProfile(req: AuthRequest, res: Response<ProfileResponse>) {
    logger.info("👤 ProfileController.getProfile()", {
      userId: req.userId?.slice(0, 8),
    });

    try {
      const userId = UserId.create(req.userId!);
      const profileResult = await profileService.getByUserId(userId);

      if (!profileResult.success) {
        return res.status(404).json({ error: profileResult.error.message });
      }

      const profile = profileResult.value;
      const response: ProfileResponseDto = {
        id: profile.userId.value,
        userId: profile.userId.value,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
        bmi: profile.calculateBMI(),
        bmiCategory: profile.getBMICategory(),
        isWeightSet: profile.isWeightSet,
        isHeightSet: profile.isHeightSet,
        isAgeSet: profile.isAgeSet,
        isLifestyleSet: profile.isLifestyleSet,
        isGoalSet: profile.isGoalSet,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      logger.info("✅ ProfileController success", { weight: profile.weight });
      res.json({ data: response });
    } catch (error: any) {
      logger.error(`ProfileController.getProfile failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  static async updateProfile(
    req: AuthRequest & Request<{}, {}, ProfileUpdateRequestDto>,
    res: Response<ProfileResponse>,
  ) {
    logger.info("👤 ProfileController.updateProfile()");

    try {
      const userId = UserId.create(req.userId!);
      const profileResult = await profileService.update(userId, req.body);

      if (!profileResult.success) {
        return res.status(400).json({ error: profileResult.error.message });
      }

      const profile = profileResult.value;
      const response: ProfileResponseDto = {
        id: profile.userId.value,
        userId: profile.userId.value,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
        bmi: profile.calculateBMI(),
        bmiCategory: profile.getBMICategory(),
        isWeightSet: profile.isWeightSet,
        isHeightSet: profile.isHeightSet,
        isAgeSet: profile.isAgeSet,
        isLifestyleSet: profile.isLifestyleSet,
        isGoalSet: profile.isGoalSet,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      logger.info("✅ ProfileController update success");
      res.json({ data: response });
    } catch (error: any) {
      logger.error(`ProfileController.updateProfile failed: ${error.message}`);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}
