// domain/entities/training-day-execution.entity.ts
import type { Wellbeing } from "../../common/types/enums.types";

export type TrainingDayExecutionEntity = {
  id: string;
  userId: string;
  week: number;
  dayOfWeek: number;
  executionDate: Date;
  wellbeingToday: Wellbeing;
  notes: string | null;
  createdAt: Date;
};

export type CreateTrainingDayExecutionEntity = Omit<
  TrainingDayExecutionEntity,
  "id" | "createdAt"
>;

export type UpdateTrainingDayExecutionEntity = Partial<
  Omit<TrainingDayExecutionEntity, "id" | "createdAt">
>;
