// presentation/controllers/plan.controller.ts
import { Response } from "express";
import { container } from "../../infrastructure/di/container";
import { AuthRequest } from "../types/auth.types";
import { UserId } from "../../common/types/ids";
import { ProfileService } from "../../domain/services/profile.service";
import { FavoriteService } from "../../domain/services/favorite.service";
import { ExerciseService } from "../../domain/services/exercise.service";
import { PlanGeneratorService } from "../../domain/services/recommendation/plan-generator.service";
import { SplitRecommenderService } from "../../domain/services/recommendation/split-recommender.service";
import { logger } from "../../common/utils";
import { ProfileDto } from "../../common/types/profile.types";
import { TrainingSplit, Wellbeing } from "../../domain/types/training.types";
import { Exercise } from "../../domain";

export class PlanController {
  // ✅ МЕТОД 1: Рекомендация сплита (SplitRecommender)
  async recommendSplit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = UserId.create(req.userId!);
      const profileService = container.get("profileService") as ProfileService;
      const profileResult = await profileService.getByUserId(userId);

      if (!profileResult.success) {
        res.status(422).json({
          error: "PROFILE_REQUIRED",
          message: "Заполни профиль (возраст, вес, рост, цель)",
        });
        return;
      }

      const profile = profileResult.value;
      const profileDto: ProfileDto = {
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        lifestyle: profile.lifestyle!,
        goal: profile.goal!,
      };

      const splitRecommender = container.get(
        "splitRecommender",
      ) as SplitRecommenderService;
      const recommendation = splitRecommender.recommend(profileDto);

      const response = {
        split: recommendation.type,
        score: recommendation.score,
        daysPerWeek: recommendation.daysPerWeek,
        alternatives: recommendation.alternatives || [],
      };

      logger.info("✅ Split recommendation:", response);
      res.status(200).json(response);
    } catch (error: any) {
      logger.error("❌ PlanController.recommendSplit error:", error);
      res.status(500).json({
        error: "Ошибка сервера",
        split: "FULL_BODY", // ✅ Fallback даже при ошибке!
      });
    }
  }

  // ✅ МЕТОД 2: Генерация плана на неделю (PlanGenerator) — ГЛАВНОЙ!
  async generatePlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        wellbeing = "normal",
        week = 1,
        split,
      } = req.body as {
        wellbeing?: Wellbeing;
        week?: number;
        split?: TrainingSplit;
      };

      const userId = UserId.create(req.userId!);

      // 1. ПРОФИЛЬ
      const profileService = container.get("profileService") as ProfileService;
      const profileResult = await profileService.getByUserId(userId);

      if (!profileResult.success) {
        res.status(422).json({
          error: "PROFILE_REQUIRED",
          message: "Заполни профиль (возраст, вес, рост, цель)",
        });
        return;
      }

      const rawProfile = profileResult.value;

      // ✅ ФИКС: UserProfile → ProfileDto
      const profileDto: ProfileDto = {
        age: rawProfile.age,
        weight: rawProfile.weight,
        height: rawProfile.height,
        lifestyle: rawProfile.lifestyle ?? undefined, // nullish coalescing!
        goal: rawProfile.goal ?? undefined,
      };

      // 2. ИЗБРАННЫЕ
      const favoriteService = container.get(
        "favoriteService",
      ) as FavoriteService;
      const favorites = Array.isArray(
        await favoriteService.getFavoritesWithExercises(userId),
      )
        ? await favoriteService.getFavoritesWithExercises(userId)
        : [];

      // 3. УПРАЖНЕНИЯ
      const exerciseService = container.get(
        "exerciseService",
      ) as ExerciseService;
      const allExercises = Array.isArray(await exerciseService.getAll())
        ? await exerciseService.getAll()
        : [];

      // 4. ✅ PlanGenerator — типы совпадают!
      const planGenerator = container.get(
        "planGenerator",
      ) as PlanGeneratorService;
      const weekPlan = planGenerator.generateWeekPlan(
        split || "FULL_BODY",
        favorites as Exercise[],
        allExercises as Exercise[],
        profileDto, // ✅ ProfileDto!
        week,
        wellbeing,
      );

      res.status(200).json(weekPlan);
    } catch (error: any) {
      logger.error("PlanController.generatePlan error:", error);
      res.status(500).json({ error: "Не удалось сгенерировать план" });
    }
  }

  // ✅ МЕТОД 3: Сегодняшняя тренировка (корректировка)
  async getTodayAdjusted(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { wellbeing = "normal" } = req.body as { wellbeing?: Wellbeing };

      // TODO: Получить текущий день из плана пользователя
      res.status(200).json({
        message: "Корректировка на сегодня",
        wellbeing,
        multiplier:
          wellbeing === "bad" ? 0.7 : wellbeing === "good" ? 1.3 : 1.0,
        adjustedSets: wellbeing === "bad" ? -1 : wellbeing === "good" ? +1 : 0,
        nextStep: "Получи план → выбери день → примени wellbeing",
      });
    } catch (error: any) {
      logger.error("PlanController.getTodayAdjusted error:", error);
      res.status(500).json({ error: "Ошибка корректировки" });
    }
  }
}
