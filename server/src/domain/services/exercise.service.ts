import { IExerciseRepository } from "../repositories/i-exercise.repository";
import { Exercise } from "../entities/exercise.entity";
import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";
import { Result } from "../common/result";
import { EntityNotFoundError } from "../common/domain-error";
import { ExerciseId } from "../../common/types/ids";

export class ExerciseService {
  constructor(private exerciseRepo: IExerciseRepository) {}

  async getById(id: ExerciseId): Promise<Result<Exercise>> {
    try {
      const exercise = await this.exerciseRepo.findById(id);
      return Result.ok(exercise);
    } catch (error) {
      return Result.error(new EntityNotFoundError("Exercise", id.value));
    }
  }

  async getByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]> {
    return this.exerciseRepo.findByMuscleGroup(muscle);
  }

  async getByType(type: ExerciseType): Promise<Exercise[]> {
    return this.exerciseRepo.findByType(type);
  }

  async getByDifficulty(difficulty: Difficulty): Promise<Exercise[]> {
    return this.exerciseRepo.findByDifficulty(difficulty);
  }

  async searchByName(name: string): Promise<Exercise[]> {
    if (!name.trim()) return [];
    return this.exerciseRepo.searchByName(name.trim());
  }

  async getAll(): Promise<Exercise[]> {
    return this.exerciseRepo.getAll();
  }

  async getPushExercises(): Promise<Exercise[]> {
    return this.exerciseRepo.findByType("PUSH");
  }

  async getPullExercises(): Promise<Exercise[]> {
    return this.exerciseRepo.findByType("PULL");
  }

  async getLegsExercises(): Promise<Exercise[]> {
    return this.exerciseRepo.findByType("LEGS");
  }
}
