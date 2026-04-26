// domain/services/training-day-execution.service.ts
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../entities/training-day-execution.entity";
import type { ITrainingDayExecutionRepository } from "../repositories/i-training-day-execution.repository";

export class TrainingDayExecutionService {
  constructor(private readonly repo: ITrainingDayExecutionRepository) {}

  // Начать тренировку
  async startTraining(
    entity: CreateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity> {
    return await this.repo.create(entity);
  }

  // Завершить тренировку
  async finishTraining(id: string): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.finishTraining(id);
  }

  // Обновить данные тренировки
  async update(
    id: string,
    entity: UpdateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.update(id, entity);
  }

  // Найти тренировку по ID
  async findById(id: string): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.findById(id);
  }

  // Найти все тренировки пользователя
  async findByUserId(userId: string): Promise<TrainingDayExecutionEntity[]> {
    return await this.repo.findByUserId(userId);
  }

  // Найти тренировку по пользователю, неделе и дню
  async findByWeekDayAndUser(
    userId: string,
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecutionEntity | null> {
    const results = await this.repo.findByWeekAndDay(userId, week, dayOfWeek);
    return results[0] ?? null;
  }

  // Найти все тренировки за неделю
  async findByUserAndWeek(
    userId: string,
    week: number,
  ): Promise<TrainingDayExecutionEntity[]> {
    const all = await this.repo.findByUserId(userId);
    return all
      .filter((d) => d.week === week)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  // Удалить тренировку
  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
