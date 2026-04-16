// data/dtos/training-exercise-execution.prisma-dto.ts
import type { Prisma } from "@prisma/client";

export type TrainingExerciseExecutionDto = {
  id: string;
  executionId: string;
  exerciseId: string;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
  wellbeingAdjusted: boolean;
  compensationNext: boolean;
};

export type CreateTrainingExerciseExecutionDto = {
  executionId: string;
  exerciseId: string;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
  wellbeingAdjusted: boolean;
  compensationNext: boolean;
};

export type UpdateTrainingExerciseExecutionDto = {
  sets?: number;
  repsRange?: Prisma.JsonValue;
  orderInDay?: number;
  wellbeingAdjusted?: boolean;
  compensationNext?: boolean;
};
