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
  forced?: boolean | null;
  forcedReason?: string | null;
};

export type CreateWeeklyTrainingExerciseDto = {
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
  forced?: boolean | null;
  forcedReason?: string | null;
};

export type UpdateWeeklyTrainingExerciseDto = {
  dayOfWeek?: number;
  sets?: number;
  repsRange?: Prisma.JsonValue;
  orderInDay?: number;
  forced?: boolean | null;
  forcedReason?: string | null;
};
