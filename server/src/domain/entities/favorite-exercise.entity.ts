// domain/entities/favorite-exercise.entity.ts
export type FavoriteExerciseEntity = {
  id: string;
  userId: string;
  exerciseId: string;
  createdAt: Date;
};

export type CreateFavoriteExerciseEntity = {
  userId: string;
  exerciseId: string;
};
