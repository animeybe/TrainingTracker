// domain/entities/favorite-exercise.entity.ts
export type FavoriteExerciseEntity = {
  id: string;
  userId: string;
  exerciseId: string;
  createdAt: Date;
};

export type CreateFavoriteExerciseEntity = Omit<
  FavoriteExerciseEntity,
  "id" | "createdAt"
>;
