// controllers/favorite.controller.ts
import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import {
  ExerciseListResponseDto,
  ExerciseResponseDto,
} from "../types/exercise.types";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";
import {
  ExerciseEntity,
  ExerciseService,
  FavoriteExerciseService,
} from "../../domain";
import { prisma } from "../../infrastructure/prisma/client";

const exerciseService = container.get(
  "exerciseService" as any,
) as ExerciseService;
const favoriteService = container.get(
  "favoriteService" as any,
) as FavoriteExerciseService;

function exerciseToResponse(exercise: ExerciseEntity): ExerciseResponseDto {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || "",
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    secondaryMuscles: exercise.secondaryMuscles || [],
    movementPatterns: exercise.movementPatterns || [],
    trainingFocus: exercise.trainingFocus || [],
    difficulty: exercise.difficulty,
    imageUrl: exercise.imageUrl || null,
    videoUrl: exercise.videoUrl || null,
  };
}

export class FavoriteController {
  static async getFavorites(
    req: AuthRequest,
    res: Response<ExerciseListResponseDto | { error: string }>,
  ) {
    try {
      const userId = req.userId!;
      const favorites = await favoriteService.findByUserId(userId);
      const exerciseIds = favorites.map((f) => f.exerciseId);

      if (!exerciseIds.length) {
        return res.json({ data: [], total: 0 });
      }

      const exercises = await exerciseService.findManyByIds(exerciseIds);
      const responseData = exercises.map(exerciseToResponse);

      res.json({
        data: responseData,
        total: responseData.length,
      });
    } catch (error: any) {
      logger.error(`Get favorites failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  }

  static async toggle(
    req: AuthRequest & Request<{ exerciseId: string }>,
    res: Response<{ success: boolean; message: string } | { error: string }>,
  ) {
    try {
      const userId = req.userId!;
      const exerciseId = req.params.exerciseId;

      // 1. Проверить, существует ли упражнение
      const exercise = await exerciseService.findById(exerciseId);
      if (!exercise) {
        logger.error(`Exercise not found: ${exerciseId}`);
        return res.status(404).json({ error: "Exercise not found" });
      }

      // 2. Проверить наличие в избранном
      const exists = await favoriteService.exists(userId, exerciseId);
      const action = exists ? "removed" : "added";

      if (exists) {
        // 1️⃣  Найти реальный `id` в БД
        const record = await prisma.favoriteExercise.findUnique({
          where: { userId_exerciseId: { userId, exerciseId } },
        });

        if (!record) {
          return res.status(404).json({ error: "Favorite record not found" });
        }

        // 2️⃣  Передать `FavoriteExerciseEntity` с реальным `id`
        const removed = await favoriteService.removeFavoriteExercise({
          id: record.id,
          userId,
          exerciseId,
          createdAt: record.createdAt,
        });
        if (!removed) {
          logger.error(`Failed to remove favorite exercise: ${exerciseId}`);
          return res.status(500).json({ error: "Failed to remove favorite" });
        }
      } else {
        // Создать в избранном
        await favoriteService.createFavoriteExercise({
          id: `${userId}_${exerciseId}`,
          userId,
          exerciseId,
          createdAt: new Date(),
        });
      }

      logger.info(`Favorite ${action}`, { userId, exerciseId });
      res.json({
        success: true,
        message:
          action === "added" ? "Добавлено в избранное" : "Убрано из избранного",
      });
    } catch (error: any) {
      logger.error(`Toggle favorite failed: ${error.message}`);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  }
}
