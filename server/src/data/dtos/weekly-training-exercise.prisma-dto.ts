// data/dtos/weekly-training-exercise.prisma-dto.ts
import type { Prisma } from "@prisma/client";

export type WeeklyTrainingExerciseDto = {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
};

export type CreateWeeklyTrainingExerciseDto = {
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
};

export type UpdateWeeklyTrainingExerciseDto = {
  dayOfWeek?: number;
  sets?: number;
  repsRange?: Prisma.JsonValue;
  orderInDay?: number;
};
