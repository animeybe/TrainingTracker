import { ExerciseId } from "../../common/types/ids";
import { Exercise } from "../entities/exercise.entity";
import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";

export interface IExerciseRepository {
  findById(id: ExerciseId): Promise<Exercise>;
  findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]>;
  findByType(type: ExerciseType): Promise<Exercise[]>;
  findByDifficulty(difficulty: Difficulty): Promise<Exercise[]>;
  searchByName(name: string): Promise<Exercise[]>;
  getAll(): Promise<Exercise[]>;
}
