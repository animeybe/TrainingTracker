import {
  WeeklyPlanEntity,
  CreateWeeklyPlanEntity,
  UpdateWeeklyPlanEntity,
} from "../entities/plan.entity";

export interface IPlanRepository {
  create(data: CreateWeeklyPlanEntity): Promise<WeeklyPlanEntity>;
  update(id: string, data: UpdateWeeklyPlanEntity): Promise<WeeklyPlanEntity>;
  findById(id: string): Promise<WeeklyPlanEntity | null>;
  findByUserId(userId: string): Promise<WeeklyPlanEntity[]>;
  findByUserIdAndWeek(
    userId: string,
    week: number,
  ): Promise<WeeklyPlanEntity | null>;
  findAll(params?: any): Promise<WeeklyPlanEntity[]>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
