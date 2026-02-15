import {
  FavoriteExerciseDto,
  isFavoriteExerciseDto,
} from "../types/favorite.dto";
import { UserId, ExerciseId } from "../../common/types/ids";
import { FavoriteExercise } from "../../domain/entities/favorite";

export class FavoriteMapper {
  toDomain(dto: FavoriteExerciseDto): FavoriteExercise {
    this.validateDto(dto);
    return new FavoriteExercise(
      UserId.create(dto.userId),
      ExerciseId.create(dto.exerciseId),
      dto.createdAt,
    );
  }

  toDomainMany(dtos: FavoriteExerciseDto[]): FavoriteExercise[] {
    return dtos.filter(isFavoriteExerciseDto).map((dto) => this.toDomain(dto));
  }

  private validateDto(
    dto: FavoriteExerciseDto,
  ): asserts dto is FavoriteExerciseDto {
    if (!isFavoriteExerciseDto(dto)) throw new Error("Invalid FavoriteDto");
  }
}
