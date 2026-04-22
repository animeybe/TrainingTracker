// data/dtos/least-favorite-exercise.prisma-dto.ts
export type LeastFavoriteExerciseDto = {
  id: string;
  userId: string;
  exerciseId: string;
  createdAt: Date;
};

export type CreateLeastFavoriteExerciseDto = {
  userId: string;
  exerciseId: string;
};
