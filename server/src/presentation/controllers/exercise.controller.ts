import { Request, Response } from "express";
import { container } from "../../di/container";
import { ExerciseResponseDto } from "../types/exercise.types";
import { MuscleGroup } from "@prisma/client";
import { logger } from "../../common/utils";

const exerciseRepo = container.get("exerciseRepo");

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

export class ExerciseController {
  static async getAll(
    req: Request,
    res: Response<
      { data: ExerciseResponseDto[]; total: number } | { error: string }
    >,
  ) {
    try {
      const exercises = await exerciseRepo.getAll();
      res.json({
        data: exercises.map(exerciseToResponse),
        total: exercises.length,
      });
    } catch (error: any) {
      logger.error(`Get exercises failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  static async getByMuscleGroup(
    req: Request<{ muscle: MuscleGroup }>,
    res: Response<
      { data: ExerciseResponseDto[]; total: number } | { error: string }
    >,
  ) {
    try {
      const exercises = await exerciseRepo.findByMuscleGroup(req.params.muscle);
      res.json({
        data: exercises.map(exerciseToResponse),
        total: exercises.length,
      });
    } catch (error: any) {
      logger.error(`Get exercises by muscle failed: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  static async search(
    req: Request<{}, {}, {}, { query?: string }>,
    res: Response<
      { data: ExerciseResponseDto[]; total: number } | { error: string }
    >,
  ) {
    try {
      const query = (req.query.query || "").toString();
      const exercises = await exerciseRepo.searchByName(query);
      res.json({
        data: exercises.map(exerciseToResponse),
        total: exercises.length,
      });
    } catch (error: any) {
      logger.error(`Search exercises failed: ${error.message}`);
      res.status(500).json({ error: "Search failed" });
    }
  }
}
