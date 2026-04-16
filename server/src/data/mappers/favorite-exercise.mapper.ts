// data/mappers/favorite-exercise.mapper.ts
import type {
  FavoriteExerciseDto,
  CreateFavoriteExerciseDto,
} from "../dtos/favorite-exercise.prisma-dto";
import type {
  FavoriteExerciseEntity,
  CreateFavoriteExerciseEntity,
} from "../../domain/entities/favorite-exercise.entity";

export class FavoriteExerciseMapper {
  static toEntity(dto: FavoriteExerciseDto): FavoriteExerciseEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      exerciseId: dto.exerciseId,
      createdAt: dto.createdAt,
    };
  }

  static toDto(entity: FavoriteExerciseEntity): FavoriteExerciseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      exerciseId: entity.exerciseId,
      createdAt: entity.createdAt,
    };
  }

  static fromCreateEntity(
    entity: CreateFavoriteExerciseEntity,
  ): CreateFavoriteExerciseDto {
    return {
      userId: entity.userId,
      exerciseId: entity.exerciseId,
    };
  }
}
