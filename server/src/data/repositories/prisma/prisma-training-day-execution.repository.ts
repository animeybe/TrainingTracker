// data/repositories/prisma/prisma-training-day-execution.repository.ts
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  TrainingDayExecutionDto,
  CreateTrainingDayExecutionDto,
} from "../../dtos/training-day-execution.prisma-dto";

export class PrismaTrainingDayExecutionRepository {
  async create(
    data: CreateTrainingDayExecutionDto,
  ): Promise<TrainingDayExecutionDto> {
    return await prisma.trainingDayExecution.create({
      data: {
        user: { connect: { id: data.userId } },
        week: data.week,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime ?? new Date(),
        endTime: data.endTime ?? null,
        wellbeingToday: data.wellbeingToday,
        notes: data.notes ?? null,
      },
    });
  }

  async findById(id: string): Promise<TrainingDayExecutionDto | null> {
    return await prisma.trainingDayExecution.findUnique({
      where: { id },
      include: { exercises: true },
    });
  }

  async findByUserId(userId: string): Promise<TrainingDayExecutionDto[]> {
    return await prisma.trainingDayExecution.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      include: { exercises: true },
    });
  }

  async findByWeekAndDay(
    userId: string,
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecutionDto[]> {
    return await prisma.trainingDayExecution.findMany({
      where: { userId, week, dayOfWeek },
      orderBy: { startTime: "desc" },
      include: { exercises: true },
    });
  }

  async update(
    id: string,
    dto: Partial<TrainingDayExecutionDto>,
  ): Promise<TrainingDayExecutionDto | null> {
    try {
      return await prisma.trainingDayExecution.update({
        where: { id },
        data: {
          endTime: dto.endTime,
          wellbeingToday: dto.wellbeingToday,
          notes: dto.notes,
        },
      });
    } catch {
      return null;
    }
  }

  async finishTraining(id: string): Promise<TrainingDayExecutionDto | null> {
    try {
      return await prisma.trainingDayExecution.update({
        where: { id },
        data: { endTime: new Date() },
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.trainingDayExecution.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findAbandoned(before: Date): Promise<TrainingDayExecutionDto[]> {
    return await prisma.trainingDayExecution.findMany({
      where: {
        endTime: null,
        startTime: { lt: before },
      },
    });
  }
}
