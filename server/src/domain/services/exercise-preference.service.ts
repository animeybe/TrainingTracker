// domain/services/exercise-preference.service.ts
import { FavoriteExerciseService } from "./favorite.service";
import { LeastFavoriteExerciseService } from "./least-favorite.service";
import { DomainError } from "../entities/domain-error";

export class ExercisePreferenceService {
  constructor(
    private readonly favoriteService: FavoriteExerciseService,
    private readonly leastFavoriteService: LeastFavoriteExerciseService,
  ) {}

  /**
   * ✅ Главный публичный API!
   * toggleFavorite → проверяет leastFavorite → toggle
   */
  async toggleFavorite(userId: string, exerciseId: string): Promise<boolean> {
    // Бизнес-правило #1: нельзя из нелюбимых в любимые
    const isLeastFavorite = await this.leastFavoriteService.exists(
      userId,
      exerciseId,
    );
    if (isLeastFavorite) {
      throw new DomainError(
        "Нельзя добавить в избранное из 'нелюбимых упражнений'",
      );
    }

    return await this.favoriteService.toggle(userId, exerciseId);
  }

  /**
   * toggleLeastFavorite → проверяет favorite → toggle
   */
  async toggleLeastFavorite(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    // Бизнес-правило #2: нельзя из любимых в нелюбимые
    const isFavorite = await this.favoriteService.exists(userId, exerciseId);
    if (isFavorite) {
      throw new DomainError("Нельзя добавить в 'нелюбимые' из избранного");
    }

    return await this.leastFavoriteService.toggle(userId, exerciseId);
  }

  /**
   * Проверка конфликтов (для UI)
   */
  async getPreferenceStatus(
    userId: string,
    exerciseId: string,
  ): Promise<"NONE" | "FAVORITE" | "LEAST_FAVORITE"> {
    const [isFavorite, isLeastFavorite] = await Promise.all([
      this.favoriteService.exists(userId, exerciseId),
      this.leastFavoriteService.exists(userId, exerciseId),
    ]);

    if (isFavorite) return "FAVORITE";
    if (isLeastFavorite) return "LEAST_FAVORITE";
    return "NONE";
  }
}
