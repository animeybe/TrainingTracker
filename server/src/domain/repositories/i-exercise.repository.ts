import { ExerciseId } from "../../common/types/ids";
import { Exercise } from "../entities";
import { MuscleGroup, ExerciseType, Difficulty } from "@prisma/client";

export interface IExerciseRepository {
  findById(id: ExerciseId): Promise<Exercise>;
  findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]>;
  findByType(type: ExerciseType): Promise<Exercise[]>;
  findByDifficulty(difficulty: Difficulty): Promise<Exercise[]>;
  searchByName(name: string): Promise<Exercise[]>;
  getAll(): Promise<Exercise[]>;
}
