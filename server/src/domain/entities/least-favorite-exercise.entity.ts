// domain/entities/least-favorite-exercise.entity.ts
export type LeastFavoriteExerciseEntity = {
  id: string;
  userId: string;
  exerciseId: string;
  createdAt: Date;
};

export type CreateLeastFavoriteExerciseEntity = Omit<
  LeastFavoriteExerciseEntity,
  "id" | "createdAt"
>;
