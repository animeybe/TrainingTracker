  // domain/services/weekly-training-exercise.service.ts
  import {
    WeeklyTrainingExerciseEntity,
    CreateWeeklyTrainingExerciseEntity,
    UpdateWeeklyTrainingExerciseEntity,
  } from "../entities/weekly-training-exercise.entity";
  import { IWeeklyTrainingExerciseRepository } from "../repositories/i-weekly-training-exercise.repository";

  export class WeeklyTrainingExerciseService {
    private repo: IWeeklyTrainingExerciseRepository;

    constructor(repo: IWeeklyTrainingExerciseRepository) {
      this.repo = repo;
    }

    async createExercise(
      entity: CreateWeeklyTrainingExerciseEntity,
    ): Promise<WeeklyTrainingExerciseEntity | null> {
      const exercise: WeeklyTrainingExerciseEntity = {
        id: "", // Prisma сам назначит
        ...entity,
      };
      return await this.repo.create(exercise);
    }

    async updateExercise(
      id: string,
      entity: WeeklyTrainingExerciseEntity,
    ): Promise<WeeklyTrainingExerciseEntity | null> {
      return await this.repo.update(id, entity);
    }

    async findById(id: string): Promise<WeeklyTrainingExerciseEntity | null> {
      return await this.repo.findById(id);
    }

    async findByPlanId(planId: string): Promise<WeeklyTrainingExerciseEntity[]> {
      return await this.repo.findByPlanId(planId);
    }

    // удобный метод: по плану+дню
    async findByPlanIdAndDay(
      planId: string,
      dayOfWeek: number,
    ): Promise<WeeklyTrainingExerciseEntity[]> {
      const all = await this.findByPlanId(planId);
      return all.filter((ex) => ex.dayOfWeek === dayOfWeek);
    }

    // удобный метод: для определённого плана и нескольких дней
    async findByPlanIdAndDays(
      planId: string,
      daysOfWeek: number[],
    ): Promise<WeeklyTrainingExerciseEntity[]> {
      const all = await this.findByPlanId(planId);
      return all.filter((ex) => daysOfWeek.includes(ex.dayOfWeek));
    }

    async deleteAllByPlanId(planId: string): Promise<void> {
      return await this.repo.deleteAllByPlanId(planId);
    }

    async delete(id: string): Promise<boolean> {
      return await this.repo.delete(id);
    }
  }
