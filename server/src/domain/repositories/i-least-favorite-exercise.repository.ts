// domain/repositories/i-least-favorite-exercise.repository.ts
import {
  LeastFavoriteExerciseEntity,
  CreateLeastFavoriteExerciseEntity,
} from "../entities";

export interface ILeastFavoriteExerciseRepository {
  create(
    data: CreateLeastFavoriteExerciseEntity,
  ): Promise<LeastFavoriteExerciseEntity>;
  findByUserId(userId: string): Promise<LeastFavoriteExerciseEntity[]>;
  deleteByComposite(userId: string, exerciseId: string): Promise<boolean>;
  exists(userId: string, exerciseId: string): Promise<boolean>;
}
