// domain/entities/training-day-execution.entity.ts
import type { Wellbeing } from "../../common/types/enums.types";

export type TrainingDayExecutionEntity = {
  id: string;
  userId: string;
  week: number;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date | null;
  wellbeingToday: Wellbeing;
  notes: string | null;
  createdAt: Date;
};

export type CreateTrainingDayExecutionEntity = {
  userId: string;
  week: number;
  dayOfWeek: number;
  startTime?: Date;
  endTime?: Date | null;
  wellbeingToday: Wellbeing;
  notes?: string | null;
};

export type UpdateTrainingDayExecutionEntity = Partial<
  Omit<TrainingDayExecutionEntity, "id" | "userId" | "createdAt">
>;
