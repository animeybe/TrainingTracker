// controllers/exercise.controller.ts
import { Request, Response } from "express";
import { container } from "../../infrastructure/di/container";
import { ExerciseService } from "../../domain/services/exercise.service";
import { ExerciseResponseDto } from "../types/exercise.types";
import { logger } from "../../common/utils";
import { PrimaryMuscleGroup } from "../../common/types/enums.types";

// ✅ Правильный тип для сервиса
const exerciseService = container.get(
  "exerciseService" as any,
) as ExerciseService;

// ✅ Адаптер: ExerciseEntity → ExerciseResponseDto (для фронта)
function exerciseToResponse(exercise: any): ExerciseResponseDto {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || "",
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    secondaryMuscles: exercise.secondaryMuscles || [],
    movementPatterns: exercise.movementPatterns,
    trainingFocus: exercise.trainingFocus,
    difficulty: exercise.difficulty,
    imageUrl: exercise.imageUrl || "",
    videoUrl: exercise.videoUrl || "",
  };
}

export class ExerciseController {
  // GET /exercises - все упражнения
  static async getAll(_req: Request, res: Response) {
    try {
      const exercises = await exerciseService.findAll();
      const responseData = exercises.map(exerciseToResponse);

      res.json({
        data: responseData,
        total: responseData.length,
      });
    } catch (error) {
      console.error("❌ getAll error:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  static async getByMuscleGroup(
    req: Request<{ muscle: string }, {}, {}, {}>,
    res: Response,
  ) {
    try {
      const { muscle } = req.params;

      const allExercises = await exerciseService.findAll();
      const exercises = allExercises.filter(
        (ex) => ex.primaryMuscleGroup === (muscle as PrimaryMuscleGroup),
      );

      const responseData = exercises.map(exerciseToResponse);

      res.json({
        data: responseData,
        total: responseData.length,
      });
    } catch (error) {
      logger.error(`Get exercises by muscle failed: ${error}`);
      res.status(500).json({ error: "Failed to fetch exercises by muscle" });
    }
  }

  static async search(
    req: Request<{}, {}, {}, { query?: string }>,
    res: Response,
  ) {
    try {
      const query = (req.query.query || "").toString().trim().toLowerCase();

      if (!query) {
        return res.json({
          data: [],
          total: 0,
        });
      }

      const allExercises = await exerciseService.findAll();
      const exercises = allExercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.primaryMuscleGroup.toLowerCase().includes(query),
      );

      const responseData = exercises.map(exerciseToResponse);

      res.json({
        data: responseData,
        total: responseData.length,
      });
    } catch (error) {
      logger.error(`Search exercises failed: ${error}`);
      res.status(500).json({ error: "Search failed" });
    }
  }
}
