// domain/repositories/i-training-day-execution.repository.ts
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../entities/training-day-execution.entity";

export interface ITrainingDayExecutionRepository {
  create(
    entity: CreateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity>;
  findById(id: string): Promise<TrainingDayExecutionEntity | null>;
  findByUserId(userId: string): Promise<TrainingDayExecutionEntity[]>;
  findByWeekAndDay(
    userId: string,
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecutionEntity[]>;
  update(
    id: string,
    entity: UpdateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null>;
  finishTraining(id: string): Promise<TrainingDayExecutionEntity | null>;
  delete(id: string): Promise<boolean>;
}
