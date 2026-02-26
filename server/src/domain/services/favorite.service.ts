import { IFavoriteRepository } from "../repositories/i-favorite.repository";
import { IExerciseRepository } from "../repositories/i-exercise.repository";
import { FavoriteExercise, Exercise } from "../entities";
import { Result } from "../common/result";
import { EntityNotFoundError } from "../common/domain-error";
import { ExerciseId, UserId } from "../../common/types/ids";

export class FavoriteService {
  constructor(
    private favoriteRepo: IFavoriteRepository,
    private exerciseRepo: IExerciseRepository,
  ) {}

  async toggleFavorite(
    userId: UserId,
    exerciseId: ExerciseId,
  ): Promise<
    Result<{ action: "added" | "removed"; favorite: FavoriteExercise }>
  > {
    try {
      const exists = await this.favoriteRepo.findByUserAndExercise(
        userId,
        exerciseId,
      );

      if (exists) {
        await this.favoriteRepo.remove(userId, exerciseId);
        return Result.ok({ action: "removed", favorite: exists });
      }

      const favorite = await this.favoriteRepo.add(userId, exerciseId);
      return Result.ok({ action: "added", favorite });
    } catch (error) {
      return Result.error(
        new EntityNotFoundError(
          "Favorite",
          `${userId.value}-${exerciseId.value}`,
        ),
      );
    }
  }

  async getFavoritesWithExercises(userId: UserId): Promise<Result<Exercise[]>> {
    try {
      const favorites = await this.favoriteRepo.getByUser(userId);
      const exercisePromises = favorites.map((fav) =>
        this.exerciseRepo.findById(fav.exerciseId).catch(() => null as any),
      );

      const exercises = (await Promise.all(exercisePromises)).filter(
        (ex): ex is Exercise => ex !== null,
      );

      return Result.ok(exercises);
    } catch (error) {
      return Result.error(new EntityNotFoundError("Favorites", userId.value));
    }
  }

  async getFavoriteCount(userId: UserId): Promise<number> {
    try {
      const favorites = await this.favoriteRepo.getByUser(userId);
      return favorites.length;
    } catch (error) {
      return 0;
    }
  }

  async isFavorite(userId: UserId, exerciseId: ExerciseId): Promise<boolean> {
    try {
      const favorite = await this.favoriteRepo.findByUserAndExercise(
        userId,
        exerciseId,
      );
      return favorite !== null;
    } catch (error) {
      return false;
    }
  }
}
