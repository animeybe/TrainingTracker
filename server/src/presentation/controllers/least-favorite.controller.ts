// controllers/least-favorite.controller.ts
import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import {
  ExerciseListResponseDto,
  ExerciseResponseDto,
} from "../types/exercise.types";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";
import {
  ExerciseService,
  ExercisePreferenceService,
  LeastFavoriteExerciseService,
} from "../../domain/services";

const exerciseService = container.get(
  "exerciseService" as any,
) as ExerciseService;
const leastFavoriteService = container.get(
  "leastFavoriteService" as any,
) as LeastFavoriteExerciseService;
const preferenceService = container.get(
  "exercisePreferenceService" as any,
) as ExercisePreferenceService;

function exerciseToResponse(exercise: any): ExerciseResponseDto {
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

export class LeastFavoriteController {
  /** get использует сервис напрямую */
  static async getLeastFavorites(
    req: AuthRequest,
    res: Response<ExerciseListResponseDto | { error: string }>,
  ) {
    try {
      const userId = req.userId!;
      const leastFavorites = await leastFavoriteService.findByUserId(userId);
      const exerciseIds = leastFavorites.map((f) => f.exerciseId);

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
      logger.error(`Get least favorites failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch least favorites" });
    }
  }

  /** toggle использует оркестратор! */
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
        logger.error(`Exercise not found: ${exerciseId}`);
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Один вызов оркестратора!
      const success = await preferenceService.toggleLeastFavorite(
        userId,
        exerciseId,
      );

      if (!success) {
        logger.warn(`Toggle least favorite returned false`, {
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
        status === "LEAST_FAVORITE"
          ? "Добавлено в нелюбимое"
          : "Убрано из нелюбимого";

      logger.info(`Least favorite toggled`, { userId, exerciseId, status });
      res.json({ success: true, message });
    } catch (error: any) {
      logger.error(`Toggle least favorite failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}
