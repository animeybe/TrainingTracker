import type { TrainingDayTypeDto, CreateTrainingDayTypeDto, UpdateTrainingDayTypeDto } from "../dtos/training-day-type.prisma-dto";
import type { TrainingDayTypeEntity, CreateTrainingDayTypeEntity, UpdateTrainingDayTypeEntity } from "../../domain/entities/training-day-type.entity";

export class TrainingDayTypeMapper {
  static toEntity(dto: TrainingDayTypeDto): TrainingDayTypeEntity {
    return {
      id: dto.id,
      planId: dto.planId,
      dayOfWeek: dto.dayOfWeek,
      dayType: dto.dayType,
    };
  }

  static fromCreateEntity(entity: CreateTrainingDayTypeEntity): CreateTrainingDayTypeDto {
    return {
      planId: entity.planId,
      dayOfWeek: entity.dayOfWeek,
      dayType: entity.dayType,
    };
  }

  static fromUpdateEntity(entity: UpdateTrainingDayTypeEntity): UpdateTrainingDayTypeDto {
    return {
      dayType: entity.dayType,
    };
  }
}
