import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  WeeklyTrainingExerciseDto,
  CreateWeeklyTrainingExerciseDto,
} from "../../dtos/weekly-training-exercise.prisma-dto";

export class PrismaWeeklyTrainingExerciseRepository {
  async create(
    data: CreateWeeklyTrainingExerciseDto,
  ): Promise<WeeklyTrainingExerciseDto> {
    return await prisma.weeklyTrainingExercise.create({
      data: {
        plan: { connect: { id: data.planId } },
        exercise: { connect: { id: data.exerciseId } },
        dayOfWeek: data.dayOfWeek,
        sets: data.sets,
        repsRange: data.repsRange ?? Prisma.JsonNull,
        orderInDay: data.orderInDay,
        forced: data.forced ?? null,
        forcedReason: data.forcedReason ?? null,
      },
    });
  }

  async findById(id: string): Promise<WeeklyTrainingExerciseDto | null> {
    const result = await prisma.weeklyTrainingExercise.findUnique({
      where: { id },
    });
    return result;
  }

  async findByPlanId(planId: string): Promise<WeeklyTrainingExerciseDto[]> {
    const results = await prisma.weeklyTrainingExercise.findMany({
      where: { planId },
      orderBy: [{ dayOfWeek: "asc" }, { orderInDay: "asc" }],
    });
    return results;
  }

  async update(
    id: string,
    dto: WeeklyTrainingExerciseDto,
  ): Promise<WeeklyTrainingExerciseDto | null> {
    try {
      const prismaInput: Prisma.weeklyTrainingExerciseUpdateInput = {
        plan: {
          connect: { id: dto.planId },
        },
        exercise: {
          connect: { id: dto.exerciseId },
        },
        dayOfWeek: dto.dayOfWeek,
        sets: dto.sets,
        repsRange: dto.repsRange ?? Prisma.JsonNull,
        orderInDay: dto.orderInDay,
      };

      const result = await prisma.weeklyTrainingExercise.update({
        where: { id },
        data: prismaInput,
      });
      return result;
    } catch (error) {
      return null;
    }
  }

  async deleteAllByPlanId(planId: string): Promise<void> {
    await prisma.weeklyTrainingExercise.deleteMany({
      where: { planId },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.weeklyTrainingExercise.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }
}
