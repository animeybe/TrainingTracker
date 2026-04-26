// data/repositories/prisma/prisma-training-exercise-execution.repository.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  TrainingExerciseExecutionDto,
  CreateTrainingExerciseExecutionDto,
} from "../../dtos/training-exercise-execution.prisma-dto";

export class PrismaTrainingExerciseExecutionRepository {
  async create(
    data: CreateTrainingExerciseExecutionDto,
  ): Promise<TrainingExerciseExecutionDto> {
    const result = await prisma.trainingExerciseExecution.create({
      data: {
        execution: { connect: { id: data.executionId } },
        exercise: { connect: { id: data.exerciseId } },
        setsData: data.setsData ?? Prisma.JsonNull,
        orderInDay: data.orderInDay,
      },
    });
    return result;
  }

  async findById(id: string): Promise<TrainingExerciseExecutionDto | null> {
    return await prisma.trainingExerciseExecution.findUnique({
      where: { id },
    });
  }

  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionDto[]> {
    return await prisma.trainingExerciseExecution.findMany({
      where: { executionId },
      orderBy: { orderInDay: "asc" },
    });
  }

  async findAll(): Promise<TrainingExerciseExecutionDto[]> {
    return await prisma.trainingExerciseExecution.findMany();
  }

  async update(
    id: string,
    dto: TrainingExerciseExecutionDto,
  ): Promise<TrainingExerciseExecutionDto | null> {
    try {
      return await prisma.trainingExerciseExecution.update({
        where: { id },
        data: {
          setsData: dto.setsData ?? Prisma.JsonNull,
          orderInDay: dto.orderInDay,
        },
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.trainingExerciseExecution.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
