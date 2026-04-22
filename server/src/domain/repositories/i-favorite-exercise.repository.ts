// domain/repositories/i-favorite-exercise.repository.ts
import {
  FavoriteExerciseEntity,
  CreateFavoriteExerciseEntity,
} from "../entities";

export interface IFavoriteExerciseRepository {
  create(data: CreateFavoriteExerciseEntity): Promise<FavoriteExerciseEntity>;
  findByUserId(userId: string): Promise<FavoriteExerciseEntity[]>;
  deleteByComposite(userId: string, exerciseId: string): Promise<boolean>;
  exists(userId: string, exerciseId: string): Promise<boolean>;
}
