// controllers/profile.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import type {
  ProfileUpdateRequestDto,
  ProfileResponseDto,
  ProfileResponse,
} from "../types/profile.types";
import { AuthRequest } from "../types/auth.types";
import { UserId } from "../../common/types/ids";
import { logger } from "../../common/utils";
import type { UserProfileService } from "../../domain/services";
import { calculateBMI, getBMICategory } from "../../common/utils/profile-utils";
import { UserProfileEntity } from "../../domain";

const profileService = container.get(
  ServiceKeys.PROFILE_SERVICE,
) as UserProfileService;

export class ProfileController {
  static async getProfile(
    req: AuthRequest,
    res: Response<ProfileResponse>,
  ): Promise<void> {

    try {
      const userId = UserId.create(req.userId!);

      const profile = await profileService.findByUserId(userId.value);
      if (!profile) {
        logger.warn("Profile not found", { userId: userId.value });
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const bmi =
        profile.weight && profile.height
          ? calculateBMI(profile.weight, profile.height)
          : null;

      const bmiCategory = getBMICategory(bmi);

      const response: ProfileResponseDto = {
        id: profile.id,
        userId: profile.userId,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        age: profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
        bmi,
        bmiCategory,
        isWeightSet: profile.weight !== null && profile.weight !== undefined,
        isHeightSet: profile.height !== null && profile.height !== undefined,
        isAgeSet: profile.age !== null && profile.age !== undefined,
        isLifestyleSet:
          profile.lifestyle !== null && profile.lifestyle !== undefined,
        isGoalSet: profile.goal !== null && profile.goal !== undefined,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      res.json({ data: response });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("ProfileController.getProfile failed", { error: err });
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  static async updateProfile(
    req: AuthRequest & Request<{}, {}, ProfileUpdateRequestDto>,
    res: Response<ProfileResponse>,
  ): Promise<void> {
    logger.info("👤 ProfileController.updateProfile()", {
      userId: req.userId,
      body: req.body,
    });

    try {
      const userId = UserId.create(req.userId!);
      const updateData: Partial<UserProfileEntity> = {
        weight: req.body.weight,
        height: req.body.height,
        gender: req.body.gender,
        age: req.body.age,
        lifestyle: req.body.lifestyle,
        goal: req.body.goal,
      };

      const updated = await profileService.updateProfile(
        userId.value,
        updateData,
      );

      if (!updated) {
        res.status(500).json({ error: "Failed to update profile" });
        return;
      }

      const bmi =
        updated.weight && updated.height
          ? calculateBMI(updated.weight, updated.height)
          : null;

      const bmiCategory = getBMICategory(bmi);

      const response: ProfileResponseDto = {
        id: updated.id,
        userId: updated.userId,
        weight: updated.weight,
        height: updated.height,
        gender: updated.gender,
        age: updated.age,
        lifestyle: updated.lifestyle,
        goal: updated.goal,
        bmi,
        bmiCategory,
        isWeightSet: updated.weight !== null && updated.weight !== undefined,
        isHeightSet: updated.height !== null && updated.height !== undefined,
        isAgeSet: updated.age !== null && updated.age !== undefined,
        isLifestyleSet:
          updated.lifestyle !== null && updated.lifestyle !== undefined,
        isGoalSet: updated.goal !== null && updated.goal !== undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      logger.info("✅ ProfileController update success", {
        weight: updated.weight,
        height: updated.height,
        gender: updated.gender,
        age: updated.age,
        lifestyle: updated.lifestyle,
        goal: updated.goal,
        bmi,
        bmiCategory,
      });

      res.json({ data: response });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("ProfileController.updateProfile failed", { error: err });
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}
