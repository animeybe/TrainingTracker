// domain/services/plan.service.ts
import {
  WeeklyPlanEntity,
  CreateWeeklyPlanEntity,
  UpdateWeeklyPlanEntity,
} from "../entities/plan.entity";
import { IPlanRepository } from "../repositories/i-plan.repository";

export class PlanService {
  private repo: IPlanRepository;

  constructor(repo: IPlanRepository) {
    this.repo = repo;
  }

  async createPlan(data: CreateWeeklyPlanEntity): Promise<WeeklyPlanEntity> {
    return await this.repo.create(data);
  }

  async updatePlan(
    id: string,
    data: UpdateWeeklyPlanEntity,
  ): Promise<WeeklyPlanEntity | null> {
    return await this.repo.update(id, data);
  }

  async findById(id: string): Promise<WeeklyPlanEntity | null> {
    return await this.repo.findById(id);
  }

  async findByUserId(userId: string): Promise<WeeklyPlanEntity[]> {
    return await this.repo.findByUserId(userId);
  }

  async findByUserIdAndWeek(
    userId: string,
    week: number,
  ): Promise<WeeklyPlanEntity | null> {
    return await this.repo.findByUserIdAndWeek(userId, week);
  }

  async findAll(params?: any): Promise<WeeklyPlanEntity[]> {
    return await this.repo.findAll(params);
  }

  async deletePlan(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.repo.exists(id);
  }
}
