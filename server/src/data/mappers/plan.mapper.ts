// data/mappers/plan.mapper.ts
import type {
  WeeklyPlanDto,
  CreateWeeklyPlanDto,
  UpdateWeeklyPlanDto,
} from "../dtos/plan.prisma-dto";
import type {
  WeeklyPlanEntity,
  CreateWeeklyPlanEntity,
  UpdateWeeklyPlanEntity,
} from "../../domain/entities/plan.entity";
import { Prisma } from "@prisma/client";

export class WeeklyPlanMapper {
  static toEntity(dto: WeeklyPlanDto): WeeklyPlanEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      week: dto.week,
      split: dto.split,
      score: dto.score,
      daysPerWeek: dto.daysPerWeek,
      restDays: dto.restDays,
      message: dto.message ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toDto(entity: WeeklyPlanEntity): WeeklyPlanDto {
    return {
      id: entity.id,
      userId: entity.userId,
      week: entity.week,
      split: entity.split,
      score: entity.score,
      daysPerWeek: entity.daysPerWeek,
      restDays: entity.restDays,
      message: entity.message,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromCreateEntity(entity: CreateWeeklyPlanEntity): CreateWeeklyPlanDto {
    return {
      userId: entity.userId,
      week: entity.week,
      split: entity.split,
      score: entity.score,
      daysPerWeek: entity.daysPerWeek,
      restDays: entity.restDays,
      message: entity.message,
    };
  }

  static fromUpdateEntity(entity: UpdateWeeklyPlanEntity): UpdateWeeklyPlanDto {
    return {
      week: entity.week,
      split: entity.split,
      score: entity.score,
      daysPerWeek: entity.daysPerWeek,
      restDays: entity.restDays,
      message: entity.message,
    };
  }

  static toExercisesPrisma(
    planId: string,
    domainDays: any[],
  ): Prisma.weeklyTrainingExerciseCreateWithoutPlanInput[] {
    return domainDays.flatMap((day) =>
      day.exercises.map((e: any) => ({
        dayOfWeek: day.dayOfWeek,
        sets: e.sets,
        repsRange: e.repsRange,
        orderInDay: e.orderInDay,
        message: e.message ?? null,
      })),
    );
  }
}
