// domain/repositories/i-training-exercise-execution.repository.ts
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../entities/training-exercise-execution.entity";

export interface ITrainingExerciseExecutionRepository {
  create(
    entity: CreateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity>;
  findById(id: string): Promise<TrainingExerciseExecutionEntity | null>;
  findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]>;
  findAll(): Promise<TrainingExerciseExecutionEntity[]>;
  update(
    id: string,
    entity: UpdateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null>;
  delete(id: string): Promise<boolean>;
}
