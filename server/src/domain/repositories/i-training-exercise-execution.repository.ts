// domain/repositories/i-training-exercise-execution.repository.ts
import type { TrainingExerciseExecutionEntity } from "../entities/training-exercise-execution.entity";

export interface ITrainingExerciseExecutionRepository {
  create(
    entity: TrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity>;
  update(
    id: string,
    entity: TrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null>;
  findById(id: string): Promise<TrainingExerciseExecutionEntity | null>;
  findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]>;
  findAll(): Promise<TrainingExerciseExecutionEntity[]>;
  delete(id: string): Promise<boolean>;
}
