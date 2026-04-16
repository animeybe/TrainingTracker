import { prisma } from "../../../infrastructure/prisma/client";
import type {
  WeeklyPlanDto,
  CreateWeeklyPlanDto,
} from "../../dtos/plan.prisma-dto";
import type { Prisma } from "@prisma/client";

export class PrismaPlanRepository {
  async create(
    data: CreateWeeklyPlanDto,
    exercises: Prisma.weeklyTrainingExerciseCreateWithoutPlanInput[] = [],
  ): Promise<WeeklyPlanDto | null> {
    try {
      const result = await prisma.weeklyTrainingPlan.create({
        data: {
          user: { connect: { id: data.userId } },
          week: data.week,
          split: data.split,
          daysPerWeek: data.daysPerWeek,
          restDays: data.restDays,
          score: data.score ?? 0,
          message: data.message ?? null,
          exercises: exercises.length > 0 ? { create: exercises } : undefined,
        },
        include: { exercises: true },
      });
      return result;
    } catch (error) {
      return null;
    }
  }

  async update(
    id: string,
    data: Prisma.weeklyTrainingPlanUpdateInput,
  ): Promise<WeeklyPlanDto | null> {
    try {
      const result = await prisma.weeklyTrainingPlan.update({
        where: { id },
        data,
        include: { exercises: true },
      });
      return result;
    } catch (error) {
      return null;
    }
  }

  async findById(id: string): Promise<WeeklyPlanDto | null> {
    const result = await prisma.weeklyTrainingPlan.findUnique({
      where: { id },
      include: { exercises: true },
    });
    return result;
  }

  async findByUserId(userId: string): Promise<WeeklyPlanDto[]> {
    const results = await prisma.weeklyTrainingPlan.findMany({
      where: { userId },
      orderBy: { week: "asc" },
      include: { exercises: true },
    });
    return results;
  }

  async findByUserIdAndWeek(
    userId: string,
    week: number,
  ): Promise<WeeklyPlanDto | null> {
    const result = await prisma.weeklyTrainingPlan.findUnique({
      where: { userId_week: { userId, week } },
      include: { exercises: true },
    });
    return result;
  }

  async findAll(params?: any): Promise<WeeklyPlanDto[]> {
    const results = await prisma.weeklyTrainingPlan.findMany({
      include: { exercises: true },
      orderBy: { week: "asc" },
    });
    return results;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.weeklyTrainingPlan.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.weeklyTrainingPlan.count({ where: { id } });
    return count > 0;
  }
}
