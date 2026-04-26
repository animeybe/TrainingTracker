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
      startTime: dto.startTime,
      endTime: dto.endTime,
      wellbeingToday: dto.wellbeingToday,
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
      startTime: entity.startTime,
      endTime: entity.endTime,
      wellbeingToday: entity.wellbeingToday,
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
      startTime: entity.startTime,
      endTime: entity.endTime,
      wellbeingToday: entity.wellbeingToday,
      notes: entity.notes,
    };
  }

  static fromUpdateEntity(
    entity: UpdateTrainingDayExecutionEntity,
  ): UpdateTrainingDayExecutionDto {
    return {
      week: entity.week,
      dayOfWeek: entity.dayOfWeek,
      endTime: entity.endTime,
      wellbeingToday: entity.wellbeingToday,
      notes: entity.notes,
    };
  }
}
