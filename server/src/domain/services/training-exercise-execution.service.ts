// domain/services/training-exercise-execution.service.ts
import {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
} from "../entities/training-exercise-execution.entity";
import { ITrainingExerciseExecutionRepository } from "../repositories/i-training-exercise-execution.repository";

export class TrainingExerciseExecutionService {
  private repo: ITrainingExerciseExecutionRepository;

  constructor(repo: ITrainingExerciseExecutionRepository) {
    this.repo = repo;
  }

  async createExec(
    entity: CreateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null> {
    const training: TrainingExerciseExecutionEntity = {
      id: "", // Prisma сам назначит
      ...entity,
    };

    return await this.repo.create(training);
  }

  async updateExec(
    id: string,
    entity: TrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null> {
    return await this.repo.update(id, entity);
  }

  async findById(id: string): Promise<TrainingExerciseExecutionEntity | null> {
    return await this.repo.findById(id);
  }

  // основной метод: все выполнения для дня тренировки
  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]> {
    return await this.repo.findByExecutionId(executionId);
  }

  async deleteExec(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
