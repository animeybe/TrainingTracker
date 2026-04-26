// data/mappers/training-exercise-execution.mapper.ts
import type {
  TrainingExerciseExecutionDto,
  CreateTrainingExerciseExecutionDto,
  UpdateTrainingExerciseExecutionDto,
} from "../dtos/training-exercise-execution.prisma-dto";
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../../domain/entities/training-exercise-execution.entity";

export class TrainingExerciseExecutionMapper {
  static toEntity(
    dto: TrainingExerciseExecutionDto,
  ): TrainingExerciseExecutionEntity {
    return {
      id: dto.id,
      executionId: dto.executionId,
      exerciseId: dto.exerciseId,
      setsData: dto.setsData,
      orderInDay: dto.orderInDay,
    };
  }

  static toDto(
    entity: TrainingExerciseExecutionEntity,
  ): TrainingExerciseExecutionDto {
    return {
      id: entity.id,
      executionId: entity.executionId,
      exerciseId: entity.exerciseId,
      setsData: entity.setsData,
      orderInDay: entity.orderInDay,
    };
  }

  static fromCreateEntity(
    entity: CreateTrainingExerciseExecutionEntity,
  ): CreateTrainingExerciseExecutionDto {
    return {
      executionId: entity.executionId,
      exerciseId: entity.exerciseId,
      setsData: entity.setsData,
      orderInDay: entity.orderInDay,
    };
  }

  static fromUpdateEntity(
    entity: UpdateTrainingExerciseExecutionEntity,
  ): UpdateTrainingExerciseExecutionDto {
    return {
      setsData: entity.setsData,
      orderInDay: entity.orderInDay,
    };
  }
}
