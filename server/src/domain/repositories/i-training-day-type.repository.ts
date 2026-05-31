import type { TrainingDayTypeEntity, CreateTrainingDayTypeEntity, UpdateTrainingDayTypeEntity } from "../entities/training-day-type.entity";

export interface ITrainingDayTypeRepository {
  create(entity: CreateTrainingDayTypeEntity): Promise<TrainingDayTypeEntity>;
  update(id: string, entity: UpdateTrainingDayTypeEntity): Promise<TrainingDayTypeEntity | null>;
  findById(id: string): Promise<TrainingDayTypeEntity | null>;
  findByPlanId(planId: string): Promise<TrainingDayTypeEntity[]>;
  findByPlanIdAndDay(planId: string, dayOfWeek: number): Promise<TrainingDayTypeEntity | null>;
  delete(id: string): Promise<boolean>;
  upsert(planId: string, dayOfWeek: number, dayType: string): Promise<TrainingDayTypeEntity>;
}
