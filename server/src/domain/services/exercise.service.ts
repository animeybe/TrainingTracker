// domain/services/exercise.service.ts
import {
  ExerciseEntity,
  CreateExerciseEntity,
  UpdateExerciseEntity,
} from "../entities/exercise.entity";
import { IExerciseRepository } from "../repositories/i-exercise.repository";

export class ExerciseService {
  private repo: IExerciseRepository;

  constructor(repo: IExerciseRepository) {
    this.repo = repo;
  }

  async createExercise(data: CreateExerciseEntity): Promise<ExerciseEntity> {
    return await this.repo.create(data);
  }

  async updateExercise(
    id: string,
    data: UpdateExerciseEntity,
  ): Promise<ExerciseEntity | null> {
    return await this.repo.update(id, data);
  }

  async findById(id: string): Promise<ExerciseEntity | null> {
    return await this.repo.findById(id);
  }

  async findManyByIds(ids: string[]): Promise<ExerciseEntity[]> {
    return await this.repo.findManyByIds(ids);
  }

  async findAll(): Promise<ExerciseEntity[]> {
    return await this.repo.findAll();
  }

  async deleteExercise(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
  
}
