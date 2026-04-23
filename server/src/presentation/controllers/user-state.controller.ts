// controllers/user-state.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { UserStateService } from "../../domain/services/user-state.service";
import { UserStateResponseDto } from "../types/user-state.types";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";

const userStateService = container.get(
  ServiceKeys.USER_STATE_SERVICE,
) as UserStateService;

export class UserStateController {
  static async getCurrentWeek(
    req: AuthRequest,
    res: Response<UserStateResponseDto | { error: string }>,
  ) {
    try {
      const userId = req.userId!;

      const userState = await userStateService.findByUserId(userId);
      if (!userState) {
        // создаём дефолтный на 1‑ю неделю
        const created = await userStateService.create({
          userId,
          currentWeek: 1,
        });
        return res.json({ currentWeek: created.currentWeek });
      }

      res.json({ currentWeek: userState.currentWeek });
    } catch (error: any) {
      logger.error(`Get user state failed: ${error.message}`);
      res.status(500).json({ error: "Failed to get user state" });
    }
  }

  static async updateCurrentWeek(
    req: AuthRequest & Request<{}, {}, { week: number }>,
    res: Response<{ success: boolean; message: string }>,
  ) {
    try {
      const userId = req.userId!;
      const { week } = req.body;

      if (!Number.isInteger(week) || week < 1) {
        return res.status(400).json({
          success: false,
          message: "Incorrect week: should be integer ≥ 1",
        });
      }

      const updated = await userStateService.updateCurrentWeek(userId, week);
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user state",
        });
      }

      res.json({
        success: true,
        message: `User's current week set to ${week}`,
      });
    } catch (error: any) {
      logger.error(`Update user state failed: ${error.message}`);
      res.status(500).json({ success: false, message: "Update failed" });
    }
  }
}
