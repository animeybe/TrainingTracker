export interface TrainingDayTypeDto {
  id: string;
  planId: string;
  dayOfWeek: number;
  dayType: string;
}

export interface CreateTrainingDayTypeDto {
  planId: string;
  dayOfWeek: number;
  dayType: string;
}

export interface UpdateTrainingDayTypeDto {
  dayType?: string;
}
