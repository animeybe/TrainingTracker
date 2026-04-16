// data/mappers/weekly-training-exercise.mapper.ts
import type {
  WeeklyTrainingExerciseDto,
  CreateWeeklyTrainingExerciseDto,
  UpdateWeeklyTrainingExerciseDto,
} from "../dtos/weekly-training-exercise.prisma-dto";
import type {
  WeeklyTrainingExerciseEntity,
  CreateWeeklyTrainingExerciseEntity,
  UpdateWeeklyTrainingExerciseEntity,
} from "../../domain/entities/weekly-training-exercise.entity";

export class WeeklyTrainingExerciseMapper {
  static toEntity(
    dto: WeeklyTrainingExerciseDto,
  ): WeeklyTrainingExerciseEntity {
    return {
      id: dto.id,
      planId: dto.planId,
      exerciseId: dto.exerciseId,
      dayOfWeek: dto.dayOfWeek,
      sets: dto.sets,
      repsRange: dto.repsRange,
      orderInDay: dto.orderInDay,
    };
  }

  static toDto(
    entity: WeeklyTrainingExerciseEntity,
  ): WeeklyTrainingExerciseDto {
    return {
      id: entity.id,
      planId: entity.planId,
      exerciseId: entity.exerciseId,
      dayOfWeek: entity.dayOfWeek,
      sets: entity.sets,
      repsRange: entity.repsRange,
      orderInDay: entity.orderInDay,
    };
  }

  static fromCreateEntity(
    entity: CreateWeeklyTrainingExerciseEntity,
  ): CreateWeeklyTrainingExerciseDto {
    return {
      planId: entity.planId,
      exerciseId: entity.exerciseId,
      dayOfWeek: entity.dayOfWeek,
      sets: entity.sets,
      repsRange: entity.repsRange,
      orderInDay: entity.orderInDay,
    };
  }

  static fromUpdateEntity(
    entity: UpdateWeeklyTrainingExerciseEntity,
  ): UpdateWeeklyTrainingExerciseDto {
    return {
      dayOfWeek: entity.dayOfWeek,
      sets: entity.sets,
      repsRange: entity.repsRange,
      orderInDay: entity.orderInDay,
    };
  }
}
