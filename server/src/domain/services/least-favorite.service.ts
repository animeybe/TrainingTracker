// domain/services/least-favorite.service.ts
import {
  LeastFavoriteExerciseEntity,
  CreateLeastFavoriteExerciseEntity,
} from "../entities";
import { ILeastFavoriteExerciseRepository } from "../repositories/i-least-favorite-exercise.repository";
import { DomainError } from "../entities/domain-error";

export class LeastFavoriteExerciseService {
  private repo: ILeastFavoriteExerciseRepository;

  constructor(repo: ILeastFavoriteExerciseRepository) {
    this.repo = repo;
  }

  /** ✅ Toggle - основной бизнес-метод! */
  async toggle(userId: string, exerciseId: string): Promise<boolean> {
    const exists = await this.repo.exists(userId, exerciseId);

    if (exists) {
      return await this.repo.deleteByComposite(userId, exerciseId);
    } else {
      await this.repo.create({
        userId,
        exerciseId,
      } as CreateLeastFavoriteExerciseEntity);
      return true;
    }
  }

  async create(
    data: CreateLeastFavoriteExerciseEntity,
  ): Promise<LeastFavoriteExerciseEntity> {
    const exists = await this.repo.exists(data.userId, data.exerciseId);
    if (exists) {
      throw new DomainError("Упражнение уже в нелюбимых");
    }
    return await this.repo.create(data);
  }

  async findByUserId(userId: string): Promise<LeastFavoriteExerciseEntity[]> {
    return await this.repo.findByUserId(userId);
  }

  async exists(userId: string, exerciseId: string): Promise<boolean> {
    return await this.repo.exists(userId, exerciseId);
  }

  async deleteByComposite(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const exists = await this.repo.exists(userId, exerciseId);
    if (!exists) return false;
    return await this.repo.deleteByComposite(userId, exerciseId);
  }
}
