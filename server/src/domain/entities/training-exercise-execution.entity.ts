// domain/entities/training-exercise-execution.entity.ts

export type TrainingExerciseExecutionEntity = {
  id: string;
  executionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  orderInDay: number;
};

export type CreateTrainingExerciseExecutionEntity = {
  executionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  orderInDay: number;
};

export type UpdateTrainingExerciseExecutionEntity = Partial<
  Omit<TrainingExerciseExecutionEntity, "id">
>;
