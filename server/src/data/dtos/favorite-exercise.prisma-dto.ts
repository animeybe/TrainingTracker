// data/dtos/favorite-exercise.prisma-dto.ts
export type FavoriteExerciseDto = {
  id: string;
  userId: string;
  exerciseId: string;
  createdAt: Date;
};

export type CreateFavoriteExerciseDto = {
  userId: string;
  exerciseId: string;
};
