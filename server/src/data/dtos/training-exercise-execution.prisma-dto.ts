// data/dtos/training-exercise-execution.prisma-dto.ts

export type TrainingExerciseExecutionDto = {
  id: string;
  executionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  orderInDay: number;
};

export type CreateTrainingExerciseExecutionDto = {
  executionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  orderInDay: number;
};

export type UpdateTrainingExerciseExecutionDto = {
  sets?: number;
  reps?: number;
  orderInDay?: number;
};
