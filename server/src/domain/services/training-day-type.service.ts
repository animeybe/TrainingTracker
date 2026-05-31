import type { ITrainingDayTypeRepository } from "../repositories/i-training-day-type.repository";
import type { TrainingDayTypeEntity } from "../entities/training-day-type.entity";

export class TrainingDayTypeService {
  constructor(private repo: ITrainingDayTypeRepository) {}

  async setDayType(planId: string, dayOfWeek: number, dayType: string): Promise<TrainingDayTypeEntity> {
    return await this.repo.upsert(planId, dayOfWeek, dayType);
  }

  async getDayType(planId: string, dayOfWeek: number): Promise<string | null> {
    const result = await this.repo.findByPlanIdAndDay(planId, dayOfWeek);
    return result?.dayType ?? null;
  }

  async getDayTypeRecord(planId: string, dayOfWeek: number): Promise<TrainingDayTypeEntity | null> {
    return await this.repo.findByPlanIdAndDay(planId, dayOfWeek);
  }

  async deleteDayType(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  async getDayTypesForPlan(planId: string): Promise<TrainingDayTypeEntity[]> {
    return await this.repo.findByPlanId(planId);
  }
}
