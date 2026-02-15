import { UserId, ExerciseId } from "../../common/types/ids";

export class FavoriteExercise {
  constructor(
    public readonly userId: UserId,
    public readonly exerciseId: ExerciseId,
    public readonly createdAt: Date,
  ) {}

  // Бизнес-логика: время в избранном
  daysInFavorites(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
