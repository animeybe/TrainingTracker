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
  ExercisePreferenceService,
  ExerciseService,
  FavoriteExerciseService,
} from "../../domain";

const exerciseService = container.get(
  "exerciseService" as any,
) as ExerciseService;
const favoriteService = container.get(
  "favoriteService" as any,
) as FavoriteExerciseService;
const preferenceService = container.get(
  "exercisePreferenceService" as any,
) as ExercisePreferenceService;

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
      const { exerciseId } = req.params;

      // Проверка упражнения
      const exercise = await exerciseService.findById(exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Один вызов оркестратора!
      const success = await preferenceService.toggleFavorite(
        userId,
        exerciseId,
      );

      if (!success) {
        logger.warn(`Toggle favorite returned false`, {
          userId,
          exerciseId,
        });
        return res.status(500).json({ error: "Toggle operation failed" });
      }

      const status = await preferenceService.getPreferenceStatus(
        userId,
        exerciseId,
      );
      const message =
        status === "FAVORITE"
          ? "Добавлено в избранное"
          : "Убрано из избранного";

      logger.info(`Favorite toggled`, { userId, exerciseId, status });
      res.json({ success: true, message });
    } catch (error: any) {
      logger.error(`Toggle favorite failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}
