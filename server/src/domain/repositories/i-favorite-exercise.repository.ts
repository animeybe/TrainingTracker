// domain/repositories/i-favorite-exercise.repository.ts
import { FavoriteExerciseEntity } from "../entities";

export interface IFavoriteExerciseRepository {
  create(data: FavoriteExerciseEntity): Promise<FavoriteExerciseEntity>;
  findByUserId(userId: string): Promise<FavoriteExerciseEntity[]>;
  delete(data: FavoriteExerciseEntity): Promise<boolean>;
  exists(userId: string, exerciseId: string): Promise<boolean>;
}
