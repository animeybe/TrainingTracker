// domain/services/favorite.service.ts
import {
  FavoriteExerciseEntity,
  CreateFavoriteExerciseEntity,
} from "../entities";
import { DomainError } from "../entities/domain-error";
import { IFavoriteExerciseRepository } from "../repositories/i-favorite-exercise.repository";

export class FavoriteExerciseService {
  private repo: IFavoriteExerciseRepository;

  constructor(repo: IFavoriteExerciseRepository) {
    this.repo = repo;
  }

  /**
   * ✅ Toggle - основной бизнес-метод!
   * Добавляет/удаляет избранное одним вызовом
   */
  async toggle(userId: string, exerciseId: string): Promise<boolean> {
    const exists = await this.repo.exists(userId, exerciseId);

    if (exists) {
      return await this.repo.deleteByComposite(userId, exerciseId);
    } else {
      await this.repo.create({
        userId,
        exerciseId,
      } as CreateFavoriteExerciseEntity);
      return true;
    }
  }

  /**
   * CRUD методы (прокси на Repository)
   */
  async create(
    data: CreateFavoriteExerciseEntity,
  ): Promise<FavoriteExerciseEntity> {
    // Бизнес-правило: не дублировать
    const exists = await this.repo.exists(data.userId, data.exerciseId);
    if (exists) {
      throw new DomainError("Упражнение уже в избранном");
    }
    return await this.repo.create(data);
  }

  async findByUserId(userId: string): Promise<FavoriteExerciseEntity[]> {
    return await this.repo.findByUserId(userId);
  }

  async exists(userId: string, exerciseId: string): Promise<boolean> {
    return await this.repo.exists(userId, exerciseId);
  }

  /**
   * Удаление по composite key (бизнес-метод)
   */
  async deleteByComposite(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const exists = await this.repo.exists(userId, exerciseId);
    if (!exists) {
      return false;
    }
    return await this.repo.deleteByComposite(userId, exerciseId);
  }
}
