import { prisma } from "../../infrastructure/prisma/client";
import {
  FavoriteExercisePrismaDto,
  isFavoriteExercisePrismaDto,
} from "../dto/favorite.prisma-dto";
import { FavoriteMapper } from "../mappers/favorite.mapper";
import { UserId, ExerciseId } from "../../common/types/ids";
import { IFavoriteRepository } from "../../domain/repositories/i-favorite.repository";
import { logger } from "../../common/utils";
import { FavoriteExercise } from "../../domain";

export class PrismaFavoriteRepository implements IFavoriteRepository {
  private readonly mapper = new FavoriteMapper();

  async findByUserAndExercise(
    userId: UserId,
    exerciseId: ExerciseId,
  ): Promise<FavoriteExercise | null> {
    const prismaData = await prisma.favoriteExercise.findUnique({
      where: {
        userId_exerciseId: {
          userId: userId.value,
          exerciseId: exerciseId.value,
        },
      },
    });

    if (!prismaData || !isFavoriteExercisePrismaDto(prismaData)) {
      return null;
    }

    return this.mapper.toDomain(prismaData);
  }

  async add(userId: UserId, exerciseId: ExerciseId): Promise<FavoriteExercise> {
    const prismaData = (await prisma.favoriteExercise.create({
      data: {
        userId: userId.value,
        exerciseId: exerciseId.value,
      },
    })) as FavoriteExercisePrismaDto;

    return this.mapper.toDomain(prismaData);
  }

  async remove(userId: UserId, exerciseId: ExerciseId): Promise<void> {
    await prisma.favoriteExercise.delete({
      where: {
        userId_exerciseId: {
          userId: userId.value,
          exerciseId: exerciseId.value,
        },
      },
    });
  }

  async getByUser(userId: UserId): Promise<FavoriteExercise[]> {
    const prismaData = (await prisma.favoriteExercise.findMany({
      where: { userId: userId.value },
    })) as FavoriteExercisePrismaDto[];

    return this.mapper.toDomainMany(prismaData);
  }
}
