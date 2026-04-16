// data/mappers/training-day-execution.mapper.ts
import type {
  TrainingDayExecutionDto,
  CreateTrainingDayExecutionDto,
  UpdateTrainingDayExecutionDto,
} from "../dtos/training-day-execution.prisma-dto";
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../../domain/entities/training-day-execution.entity";

export class TrainingDayExecutionMapper {
  static toEntity(dto: TrainingDayExecutionDto): TrainingDayExecutionEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      week: dto.week,
      dayOfWeek: dto.dayOfWeek,
      executionDate: dto.executionDate,
      wellbeingToday: dto.wellbeingToday,
      setsCompleted: dto.setsCompleted,
      notes: dto.notes,
      createdAt: dto.createdAt,
    };
  }

  static toDto(entity: TrainingDayExecutionEntity): TrainingDayExecutionDto {
    return {
      id: entity.id,
      userId: entity.userId,
      week: entity.week,
      dayOfWeek: entity.dayOfWeek,
      executionDate: entity.executionDate,
      wellbeingToday: entity.wellbeingToday,
      setsCompleted: entity.setsCompleted,
      notes: entity.notes,
      createdAt: entity.createdAt,
    };
  }

  static fromCreateEntity(
    entity: CreateTrainingDayExecutionEntity,
  ): CreateTrainingDayExecutionDto {
    return {
      userId: entity.userId,
      week: entity.week,
      dayOfWeek: entity.dayOfWeek,
      executionDate: entity.executionDate,
      wellbeingToday: entity.wellbeingToday,
      setsCompleted: entity.setsCompleted,
      notes: entity.notes,
    };
  }

  static fromUpdateEntity(
    entity: UpdateTrainingDayExecutionEntity,
  ): UpdateTrainingDayExecutionDto {
    return {
      week: entity.week,
      dayOfWeek: entity.dayOfWeek,
      executionDate: entity.executionDate,
      wellbeingToday: entity.wellbeingToday,
      setsCompleted: entity.setsCompleted,
      notes: entity.notes,
    };
  }
}
