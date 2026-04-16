import { PrismaPlanRepository } from "../prisma/prisma-plan.repository";
import { WeeklyPlanMapper } from "../../mappers/plan.mapper";
import type {
  WeeklyPlanEntity,
  CreateWeeklyPlanEntity,
  UpdateWeeklyPlanEntity,
} from "../../../domain/entities/plan.entity";
import type { IPlanRepository } from "../../../domain/repositories/i-plan.repository";
import { WeeklyPlanDto } from "../../dtos";

export class PlanRepositoryImpl implements IPlanRepository {
  constructor(private readonly prismaRepo: PrismaPlanRepository) {}

  async create(
    entity: CreateWeeklyPlanEntity,
    domainDays?: any[],
  ): Promise<WeeklyPlanEntity> {
    const dto = WeeklyPlanMapper.fromCreateEntity(entity);
    const exercises =
      domainDays && domainDays.length > 0
        ? WeeklyPlanMapper.toExercisesPrisma("temp-id", domainDays)
        : [];

    // Проверка на существующий план
    const existing = await this.prismaRepo.findByUserIdAndWeek(
      entity.userId,
      entity.week,
    );

    let dtoResult: WeeklyPlanDto | null;

    if (existing) {
      // Обновляем существующий план
      dtoResult = await this.prismaRepo.update(existing.id, dto);
    } else {
      // Создаём новый план
      dtoResult = await this.prismaRepo.create(dto, exercises);
    }

    if (!dtoResult) throw new Error("Plan save failed");

    return WeeklyPlanMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: UpdateWeeklyPlanEntity,
  ): Promise<WeeklyPlanEntity> {
    const dto = WeeklyPlanMapper.fromUpdateEntity(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) throw new Error("Failed to update the plan");
    return WeeklyPlanMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<WeeklyPlanEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) throw new Error("Failed to update the plan");
    return WeeklyPlanMapper.toEntity(dto);
  }

  async findByUserId(userId: string): Promise<WeeklyPlanEntity[]> {
    const dtoList = await this.prismaRepo.findByUserId(userId);
    return dtoList.map(WeeklyPlanMapper.toEntity);
  }

  async findByUserIdAndWeek(
    userId: string,
    week: number,
  ): Promise<WeeklyPlanEntity | null> {
    const dto = await this.prismaRepo.findByUserIdAndWeek(userId, week);
    if (!dto) return null;
    return WeeklyPlanMapper.toEntity(dto);
  }

  async findAll(params?: any): Promise<WeeklyPlanEntity[]> {
    const dtoList = await this.prismaRepo.findAll(params);
    return dtoList.map(WeeklyPlanMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.prismaRepo.exists(id);
  }
}
