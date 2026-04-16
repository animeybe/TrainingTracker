// domain/repositories/i-exercise.repository.ts
import {
  ExerciseEntity,
  CreateExerciseEntity,
  UpdateExerciseEntity,
} from "../entities/exercise.entity";

export interface IExerciseRepository {
  create(data: CreateExerciseEntity): Promise<ExerciseEntity>;
  update(
    id: string,
    data: UpdateExerciseEntity,
  ): Promise<ExerciseEntity | null>;
  findById(id: string): Promise<ExerciseEntity | null>;
  findManyByIds(ids: string[]): Promise<ExerciseEntity[]>;
  findAll(): Promise<ExerciseEntity[]>;
  delete(id: string): Promise<boolean>;
}
