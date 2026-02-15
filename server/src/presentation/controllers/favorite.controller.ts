import { Request, Response } from "express";
import { container } from "../../di/container";
import {
  ExerciseListResponseDto,
  ExerciseResponseDto,
} from "../types/exercise.types";
import { ToggleFavoriteResponseDto } from "../types/favorite.types";
import { UserId, ExerciseId } from "../../common/types/ids";
import { logger } from "../../common/utils";

const favoriteService = container.get("favoriteService");

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
    req: Request<{ exerciseId: string }>,
    res: Response<ToggleFavoriteResponseDto | { error: string }>,
  ) {
    try {
      const userId = UserId.create((req as any).user.id);
      const exerciseId = ExerciseId.create(req.params.exerciseId);

      await favoriteService.toggleFavorite(userId, exerciseId);

      res.json({
        success: true,
        message: "Favorite toggled successfully",
      });
    } catch (error: any) {
      if (error.message.includes("Removed")) {
        res.json({ success: true, message: "Removed from favorites" });
      } else {
        logger.error(`Toggle favorite failed: ${error.message}`);
        res.status(500).json({ error: "Failed to toggle favorite" });
      }
    }
  }

  static async getFavorites(
    req: Request,
    res: Response<ExerciseListResponseDto | { error: string }>,
  ) {
    try {
      const userId = UserId.create((req as any).user.id);
      const exercises = await favoriteService.getFavoritesWithExercises(userId);

      res.json({
        data: exercises.map(exerciseToResponse),
        total: exercises.length,
      });
    } catch (error: any) {
      logger.error(`Get favorites failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  }
}
