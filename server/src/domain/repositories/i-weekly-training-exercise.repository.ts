import { WeeklyTrainingExerciseEntity } from "../entities/weekly-training-exercise.entity";

export interface IWeeklyTrainingExerciseRepository {
  create(
    entity: WeeklyTrainingExerciseEntity,
  ): Promise<WeeklyTrainingExerciseEntity>;
  update(
    id: string,
    entity: WeeklyTrainingExerciseEntity,
  ): Promise<WeeklyTrainingExerciseEntity | null>;
  findById(id: string): Promise<WeeklyTrainingExerciseEntity | null>;
  findByPlanId(planId: string): Promise<WeeklyTrainingExerciseEntity[]>;
  deleteAllByPlanId(planId: string): Promise<void>;
  delete(id: string): Promise<boolean>;
}
