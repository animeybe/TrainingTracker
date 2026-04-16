// domain/entities/weekly-training-exercise.entity.ts
import type { Prisma } from "@prisma/client";

export type WeeklyTrainingExerciseEntity = {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
};

export type CreateWeeklyTrainingExerciseEntity = {
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  repsRange: Prisma.JsonValue;
  orderInDay: number;
};

export type UpdateWeeklyTrainingExerciseEntity = Partial<
  Omit<WeeklyTrainingExerciseEntity, "id" | "createdAt" | "updatedAt">
>;
