// data/repositories/prisma/prisma-training-exercise-execution.repository.ts
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  TrainingExerciseExecutionDto,
  CreateTrainingExerciseExecutionDto,
} from "../../dtos/training-exercise-execution.prisma-dto";
import { Prisma } from "@prisma/client";

export class PrismaTrainingExerciseExecutionRepository {
  async create(
    data: CreateTrainingExerciseExecutionDto,
  ): Promise<TrainingExerciseExecutionDto> {
    const result = await prisma.trainingExerciseExecution.create({
      data: {
        execution: {
          connect: { id: data.executionId },
        },
        exercise: {
          connect: { id: data.exerciseId },
        },
        sets: data.sets,
        repsRange: data.repsRange ?? Prisma.JsonNull,
        orderInDay: data.orderInDay,
      } satisfies Prisma.trainingExerciseExecutionCreateInput,
    });
    return result;
  }

  async findById(id: string): Promise<TrainingExerciseExecutionDto | null> {
    const result = await prisma.trainingExerciseExecution.findUnique({
      where: { id },
    });
    return result;
  }

  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionDto[]> {
    const results = await prisma.trainingExerciseExecution.findMany({
      where: { executionId },
      orderBy: { orderInDay: "asc" },
    });
    return results;
  }

  async findAll(): Promise<TrainingExerciseExecutionDto[]> {
    const results = await prisma.trainingExerciseExecution.findMany();
    return results;
  }

  async update(
    id: string,
    dto: TrainingExerciseExecutionDto,
  ): Promise<TrainingExerciseExecutionDto | null> {
    try {
      const result = await prisma.trainingExerciseExecution.update({
        where: { id },
        data: {
          sets: dto.sets,
          repsRange: dto.repsRange ?? Prisma.JsonNull,
          orderInDay: dto.orderInDay,
        } satisfies Prisma.trainingExerciseExecutionUpdateInput,
      });
      return result;
    } catch (_error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.trainingExerciseExecution.delete({ where: { id } });
      return true;
    } catch (_error) {
      return false;
    }
  }
}
