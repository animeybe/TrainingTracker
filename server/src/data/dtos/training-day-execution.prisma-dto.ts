// data/dtos/training-day-execution.prisma-dto.ts
import type { Wellbeing } from "../../common/types/enums.types";

export type TrainingDayExecutionDto = {
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

export type CreateTrainingDayExecutionDto = {
  userId: string;
  week: number;
  dayOfWeek: number;
  startTime?: Date; // по умолчанию now()
  endTime?: Date | null;
  wellbeingToday: Wellbeing;
  notes?: string | null;
};

export type UpdateTrainingDayExecutionDto = {
  week?: number;
  dayOfWeek?: number;
  endTime?: Date | null;
  wellbeingToday?: Wellbeing;
  notes?: string | null;
};
