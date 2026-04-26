// data/dtos/training-exercise-execution.prisma-dto.ts
import type { Prisma } from "@prisma/client";

export type TrainingExerciseExecutionDto = {
  id: string;
  executionId: string;
  exerciseId: string;
  setsData: Prisma.JsonValue;
  orderInDay: number;
};

export type CreateTrainingExerciseExecutionDto = {
  executionId: string;
  exerciseId: string;
  setsData: Prisma.JsonValue;
  orderInDay: number;
};

export type UpdateTrainingExerciseExecutionDto = {
  setsData?: Prisma.JsonValue;
  orderInDay?: number;
};
