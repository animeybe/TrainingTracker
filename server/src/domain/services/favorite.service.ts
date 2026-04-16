// domain/services/favorite.service.ts
import { FavoriteExerciseEntity } from "../entities";
import { IFavoriteExerciseRepository } from "../repositories/i-favorite-exercise.repository";

export class FavoriteExerciseService {
  private repo: IFavoriteExerciseRepository;

  constructor(repo: IFavoriteExerciseRepository) {
    this.repo = repo;
  }

  async createFavoriteExercise(
    data: FavoriteExerciseEntity,
  ): Promise<FavoriteExerciseEntity> {
    return await this.repo.create(data);
  }

  async findByUserId(userId: string): Promise<FavoriteExerciseEntity[]> {
    return await this.repo.findByUserId(userId);
  }

  async removeFavoriteExercise(data: FavoriteExerciseEntity): Promise<boolean> {
    return await this.repo.delete(data);
  }

  async exists(userId: string, exerciseId: string): Promise<boolean> {
    return await this.repo.exists(userId, exerciseId);
  }
}
