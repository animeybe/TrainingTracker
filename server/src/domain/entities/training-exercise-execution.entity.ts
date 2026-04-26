// domain/entities/training-exercise-execution.entity.ts
import type { Prisma } from "@prisma/client";

export type TrainingExerciseExecutionEntity = {
  id: string;
  executionId: string;
  exerciseId: string;
  setsData: Prisma.JsonValue;
  orderInDay: number;
};

export type CreateTrainingExerciseExecutionEntity = {
  executionId: string;
  exerciseId: string;
  setsData: Prisma.JsonValue;
  orderInDay: number;
};

export type UpdateTrainingExerciseExecutionEntity = Partial<
  Omit<TrainingExerciseExecutionEntity, "id" | "executionId" | "exerciseId">
>;
