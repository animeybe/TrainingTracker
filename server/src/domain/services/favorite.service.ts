import { IFavoriteRepository } from "..";
import { IExerciseRepository } from "..";
import { FavoriteExercise } from "..";
import { Exercise } from "../entities";
import { UserId, ExerciseId } from "../../common/types/ids";

export class FavoriteService {
  constructor(
    private favoriteRepo: IFavoriteRepository,
    private exerciseRepo: IExerciseRepository,
  ) {}

  async toggleFavorite(
    userId: UserId,
    exerciseId: ExerciseId,
  ): Promise<FavoriteExercise> {
    const exists = await this.favoriteRepo.findByUserAndExercise(
      userId,
      exerciseId,
    );

    if (exists) {
      await this.favoriteRepo.remove(userId, exerciseId);
      throw new Error("Removed from favorites");
    }

    return this.favoriteRepo.add(userId, exerciseId);
  }

  async getFavoritesWithExercises(userId: UserId): Promise<Exercise[]> {
    const favorites = await this.favoriteRepo.getByUser(userId);
    const exercisePromises = favorites.map((fav) =>
      this.exerciseRepo.findById(fav.exerciseId),
    );
    return Promise.all(exercisePromises);
  }
}
