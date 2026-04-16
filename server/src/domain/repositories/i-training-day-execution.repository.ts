// domain/repositories/i-training-day-execution.repository.ts
import type { TrainingDayExecutionEntity } from "../entities/training-day-execution.entity";

export interface ITrainingDayExecutionRepository {
  create(
    entity: TrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity>;
  update(
    id: string,
    entity: TrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null>;
  findById(id: string): Promise<TrainingDayExecutionEntity | null>;
  findByWeekDayAndUser(
    userId: string,
    week: number,
    dayOfWeek: number,
    executionDate: Date,
  ): Promise<TrainingDayExecutionEntity | null>;
  findAll(): Promise<TrainingDayExecutionEntity[]>;
  delete(id: string): Promise<boolean>;
}
