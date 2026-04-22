// data/mappers/least-favorite-exercise.mapper.ts
import type {
  LeastFavoriteExerciseDto,
  CreateLeastFavoriteExerciseDto,
} from "../dtos/least-favorite-exercise.prisma-dto";
import type {
  LeastFavoriteExerciseEntity,
  CreateLeastFavoriteExerciseEntity,
} from "../../domain/entities/least-favorite-exercise.entity";

export class LeastFavoriteExerciseMapper {
  static toEntity(dto: LeastFavoriteExerciseDto): LeastFavoriteExerciseEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      exerciseId: dto.exerciseId,
      createdAt: dto.createdAt,
    };
  }

  static toDto(entity: LeastFavoriteExerciseEntity): LeastFavoriteExerciseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      exerciseId: entity.exerciseId,
      createdAt: entity.createdAt,
    };
  }

  static fromCreateEntity(
    entity: CreateLeastFavoriteExerciseEntity,
  ): CreateLeastFavoriteExerciseDto {
    return {
      userId: entity.userId,
      exerciseId: entity.exerciseId,
    };
  }
}
