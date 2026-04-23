// domain/services/training-day-execution.service.ts
import {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
} from "../entities/training-day-execution.entity";
import { ITrainingDayExecutionRepository } from "../repositories/i-training-day-execution.repository";

export class TrainingDayExecutionService {
  private repo: ITrainingDayExecutionRepository;

  constructor(repo: ITrainingDayExecutionRepository) {
    this.repo = repo;
  }

  async createDay(
    entity: CreateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity> {
    const exists = await this.repo.findByWeekDayAndUser(
      entity.userId,
      entity.week,
      entity.dayOfWeek,
      new Date(entity.executionDate),
    );

    if (exists) {
      throw new Error("Дневное выполнение тренировки уже существует");
    }

    return await this.repo.create(entity);
  }

  async updateDay(
    id: string,
    entity: TrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.update(id, entity);
  }

  async findById(id: string): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.findById(id);
  }

  // 💡 Основной метод: найти день тренировки по юзеру, неделе, дню, дате
  async findByWeekDayDateAndUser(
    userId: string,
    week: number,
    dayOfWeek: number,
    executionDate: Date,
  ): Promise<TrainingDayExecutionEntity | null> {
    return await this.repo.findByWeekDayAndUser(
      userId,
      week,
      dayOfWeek,
      executionDate,
    );
  }

  // игнорировать executionDate, если хочется быстро посмотреть «день недели»
  async findByWeekDayAndUserDateless(
    userId: string,
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecutionEntity | null> {
    const all = await this.repo.findAll();
    const found = all.find(
      (d) =>
        d.userId === userId && d.week === week && d.dayOfWeek === dayOfWeek,
    );
    return found ?? null;
  }

  async deleteDay(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  // полезные утилиты

  async findByUserAndWeek(
    userId: string,
    week: number,
  ): Promise<TrainingDayExecutionEntity[]> {
    const all = await this.repo.findAll();
    return all
      .filter((d) => d.userId === userId && d.week === week)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }
}
