// data/repositories/prisma/prisma-training-day-execution.repository.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  TrainingDayExecutionDto,
  CreateTrainingDayExecutionDto,
} from "../../dtos/training-day-execution.prisma-dto";
import { Wellbeing } from "../../../common/types/enums.types";

export class PrismaTrainingDayExecutionRepository {
  async create(
    data: CreateTrainingDayExecutionDto,
  ): Promise<TrainingDayExecutionDto> {
    const result = await prisma.trainingDayExecution.create({
      data: {
        user: {
          connect: { id: data.userId },
        },
        week: data.week,
        dayOfWeek: data.dayOfWeek,
        executionDate: data.executionDate,
        wellbeingToday: data.wellbeingToday,
        notes: data.notes,
      } satisfies Prisma.trainingDayExecutionCreateInput,
    });
    return result;
  }

  async findById(id: string): Promise<TrainingDayExecutionDto | null> {
    const result = await prisma.trainingDayExecution.findUnique({
      where: { id },
    });
    return result;
  }

  async findByWeekDayAndUser(
    userId: string,
    week: number,
    dayOfWeek: number,
    executionDate: Date,
  ): Promise<TrainingDayExecutionDto | null> {
    const startOfDay = new Date(executionDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const result = await prisma.trainingDayExecution.findFirst({
      where: {
        userId,
        week,
        dayOfWeek,
        executionDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (!result) return null;

    return {
      id: result.id,
      userId: result.userId,
      week: result.week,
      dayOfWeek: result.dayOfWeek,
      executionDate: new Date(result.executionDate),
      wellbeingToday: result.wellbeingToday as Wellbeing,
      notes: result.notes,
      createdAt: new Date(result.createdAt),
    };
  }

  async findAll(): Promise<TrainingDayExecutionDto[]> {
    const results = await prisma.trainingDayExecution.findMany();
    return results;
  }

  async update(
    id: string,
    dto: TrainingDayExecutionDto,
  ): Promise<TrainingDayExecutionDto | null> {
    try {
      const result = await prisma.trainingDayExecution.update({
        where: { id },
        data: {
          week: dto.week,
          dayOfWeek: dto.dayOfWeek,
          executionDate: dto.executionDate,
          wellbeingToday: dto.wellbeingToday,
          notes: dto.notes,
        } satisfies Prisma.trainingDayExecutionUpdateInput,
      });
      return result;
    } catch (_error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.trainingDayExecution.delete({ where: { id } });
      return true;
    } catch (_error) {
      return false;
    }
  }
}
