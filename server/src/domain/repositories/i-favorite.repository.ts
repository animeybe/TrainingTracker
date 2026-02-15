import { UserId, ExerciseId } from "../../common/types/ids";
import { FavoriteExercise } from "../entities";

export interface IFavoriteRepository {
  findByUserAndExercise(
    userId: UserId,
    exerciseId: ExerciseId,
  ): Promise<FavoriteExercise | null>;
  add(userId: UserId, exerciseId: ExerciseId): Promise<FavoriteExercise>;
  remove(userId: UserId, exerciseId: ExerciseId): Promise<void>;
  getByUser(userId: UserId): Promise<FavoriteExercise[]>;
}
