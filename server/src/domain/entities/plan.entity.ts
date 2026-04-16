// domain/entities/plan.entity.ts
import type { TrainingSplit } from "../../common/types/enums.types";

export type WeeklyPlanEntity = {
  id: string;
  userId: string;
  week: number;
  split: TrainingSplit;
  score: number;
  daysPerWeek: number;
  restDays: number[];
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWeeklyPlanEntity = {
  userId: string;
  week: number;
  split: TrainingSplit;
  score: number;
  daysPerWeek: number;
  restDays: number[];
  message: string | null;
};

export type UpdateWeeklyPlanEntity = Partial<
  Omit<WeeklyPlanEntity, "id" | "userId" | "createdAt" | "updatedAt">
>;