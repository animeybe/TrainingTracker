export interface TrainingDayTypeEntity {
  id: string;
  planId: string;
  dayOfWeek: number;
  dayType: string;
}

export interface CreateTrainingDayTypeEntity {
  planId: string;
  dayOfWeek: number;
  dayType: string;
}

export interface UpdateTrainingDayTypeEntity {
  dayType?: string;
}
