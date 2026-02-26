import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import { FavoriteService } from "../../domain/services/favorite.service";
import {
  ExerciseListResponseDto,
  ExerciseResponseDto,
} from "../types/exercise.types";
import { AuthRequest } from "../types/auth.types";
import { UserId, ExerciseId } from "../../common/types/ids";
import { logger } from "../../common/utils";
import { ToggleFavoriteResponseDto } from "../types/favorite.types";

const favoriteService = container.get("favoriteService") as FavoriteService;

function exerciseToResponse(exercise: any): ExerciseResponseDto {
  return {
    id: exercise.id.value,
    name: exercise.name,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    secondaryMuscles: exercise.secondaryMuscles,
    type: exercise.type,
    difficulty: exercise.difficulty,
    imageUrl: exercise.imageUrl,
    videoUrl: exercise.videoUrl,
  };
}

export class FavoriteController {
  static async toggle(
    req: AuthRequest & Request<{ exerciseId: string }>,
    res: Response<{ success: boolean; message: string } | { error: string }>,
  ) {
    try {
      const userId = UserId.create(req.userId!);
      const exerciseId = ExerciseId.create(req.params.exerciseId);

      const result = await favoriteService.toggleFavorite(userId, exerciseId);

      if (!result.success) {
        logger.error(`Toggle favorite failed: ${result.error.message}`);
        return res.status(500).json({ error: "Failed to toggle favorite" });
      }

      res.json({
        success: true,
        message:
          result.value.action === "added"
            ? "Added to favorites"
            : "Removed from favorites",
      });
    } catch (error: any) {
      logger.error(`Toggle favorite failed: ${error.message}`);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  }

  static async getFavorites(
    req: AuthRequest,
    res: Response<ExerciseListResponseDto | { error: string }>,
  ) {
    try {
      logger.info(`Getting favorites for userId: ${req.userId?.slice(0, 8)}`);
      const userId = UserId.create(req.userId!);

      const result = await favoriteService.getFavoritesWithExercises(userId);

      if (!result.success) {
        logger.error(`Get favorites failed: ${result.error.message}`);
        return res.status(500).json({ error: "Failed to fetch favorites" });
      }

      res.json({
        data: result.value.map(exerciseToResponse),
        total: result.value.length,
      });
    } catch (error: any) {
      logger.error(`Get favorites failed: ${error.message}`, {
        stack: error.stack,
      });
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  }
}
