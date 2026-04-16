// data/dtos/plan.prisma-dto.ts
import type { TrainingSplit } from "../../common/types/enums.types";

export type WeeklyPlanDto = {
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

export type CreateWeeklyPlanDto = {
  userId: string;
  week: number;
  split: TrainingSplit;
  score: number;
  daysPerWeek: number;
  restDays: number[];
  message: string | null;
};

export type UpdateWeeklyPlanDto = {
  week?: number;
  split?: TrainingSplit;
  score?: number;
  daysPerWeek?: number;
  restDays?: number[];
  message?: string | null;
};
