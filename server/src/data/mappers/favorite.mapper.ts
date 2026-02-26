import {
  FavoriteExercisePrismaDto,
  isFavoriteExercisePrismaDto,
} from "../dto/favorite.prisma-dto";
import { FavoriteExercise } from "../../domain/entities/favorite.entity";
import { UserId, ExerciseId } from "../../common/types/ids";
import { BaseMapper } from "../common/base.mapper";

export class FavoriteMapper extends BaseMapper<
  FavoriteExercisePrismaDto,
  FavoriteExercise
> {
  protected doMap(prismaDto: FavoriteExercisePrismaDto): FavoriteExercise {
    return new FavoriteExercise(
      UserId.create(prismaDto.userId),
      ExerciseId.create(prismaDto.exerciseId),
      prismaDto.createdAt,
    );
  }

  protected validatePrismaDto(prismaData: unknown): FavoriteExercisePrismaDto {
    if (!isFavoriteExercisePrismaDto(prismaData)) {
      throw new Error(
        `Invalid FavoriteExercisePrismaDto: ${JSON.stringify(prismaData)}`,
      );
    }
    return prismaData;
  }

  protected isValidPrismaDto(data: unknown): data is FavoriteExercisePrismaDto {
    return isFavoriteExercisePrismaDto(data);
  }
}
