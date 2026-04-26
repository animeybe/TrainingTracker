// domain/services/training-exercise-execution.service.ts
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../entities/training-exercise-execution.entity";
import type { ITrainingExerciseExecutionRepository } from "../repositories/i-training-exercise-execution.repository";

export class TrainingExerciseExecutionService {
  constructor(private readonly repo: ITrainingExerciseExecutionRepository) {}

  // Добавить выполненное упражнение
  async addExercise(
    entity: CreateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity> {
    return await this.repo.create(entity);
  }

  // Обновить данные выполнения упражнения
  async update(
    id: string,
    entity: UpdateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null> {
    return await this.repo.update(id, entity);
  }

  // Найти по ID
  async findById(id: string): Promise<TrainingExerciseExecutionEntity | null> {
    return await this.repo.findById(id);
  }

  // Найти все упражнения в тренировке
  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]> {
    return await this.repo.findByExecutionId(executionId);
  }

  // Найти все выполнения
  async findAll(): Promise<TrainingExerciseExecutionEntity[]> {
    return await this.repo.findAll();
  }

  // Удалить упражнение из тренировки
  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
