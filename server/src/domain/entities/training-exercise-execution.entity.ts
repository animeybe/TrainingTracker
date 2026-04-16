// domain/entities/training-exercise-execution.entity.ts
import type { Prisma } from "@prisma/client";

export type TrainingExerciseExecutionEntity = {
  id: string;
  executionId: string;
  exerciseId: string;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
  wellbeingAdjusted: boolean;
  compensationNext: boolean;
};

export type CreateTrainingExerciseExecutionEntity = {
  executionId: string;
  exerciseId: string;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
  wellbeingAdjusted: boolean;
  compensationNext: boolean;
};

export type UpdateTrainingExerciseExecutionEntity = Partial<
  Omit<TrainingExerciseExecutionEntity, "id">
>;
