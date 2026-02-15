import { PrismaClient } from "@prisma/client";
import {
  FavoriteExerciseDto,
  isFavoriteExerciseDto,
} from "../types/favorite.dto";
import { FavoriteMapper } from "../mappers/favorite.mapper";
import { UserId, ExerciseId } from "../../common/types/ids";
import { IFavoriteRepository } from "../../domain/repositories/i-favorite.repository";
import { FavoriteExercise } from "../../domain/entities/favorite";

export class PrismaFavoriteRepository implements IFavoriteRepository {
  private readonly mapper = new FavoriteMapper();
  constructor(private prisma: PrismaClient) {}

  async findByUserAndExercise(
    userId: UserId,
    exerciseId: ExerciseId,
  ): Promise<FavoriteExercise | null> {
    const dto = (await this.prisma.favoriteExercise.findUnique({
      where: {
        userId_exerciseId: {
          userId: userId.value,
          exerciseId: exerciseId.value,
        },
      },
    })) as FavoriteExerciseDto | null;
    return dto && isFavoriteExerciseDto(dto) ? this.mapper.toDomain(dto) : null;
  }

  async add(userId: UserId, exerciseId: ExerciseId): Promise<FavoriteExercise> {
    const dto = (await this.prisma.favoriteExercise.create({
      data: { userId: userId.value, exerciseId: exerciseId.value },
    })) as FavoriteExerciseDto;
    return this.mapper.toDomain(dto);
  }

  async remove(userId: UserId, exerciseId: ExerciseId): Promise<void> {
    await this.prisma.favoriteExercise.delete({
      where: {
        userId_exerciseId: {
          userId: userId.value,
          exerciseId: exerciseId.value,
        },
      },
    });
  }

  async getByUser(userId: UserId): Promise<FavoriteExercise[]> {
    const dtos = (await this.prisma.favoriteExercise.findMany({
      where: { userId: userId.value },
    })) as FavoriteExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }
}
