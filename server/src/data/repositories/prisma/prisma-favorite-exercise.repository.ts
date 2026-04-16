import { prisma } from "../../../infrastructure/prisma/client";
import type {
  FavoriteExerciseDto,
  CreateFavoriteExerciseDto,
} from "../../dtos/favorite-exercise.prisma-dto";

export class PrismaFavoriteExerciseRepository {
  async create(data: CreateFavoriteExerciseDto): Promise<FavoriteExerciseDto> {
    const result = await prisma.favoriteExercise.create({ data });
    return result;
  }

  async findById(id: string): Promise<FavoriteExerciseDto | null> {
    const result = await prisma.favoriteExercise.findUnique({ where: { id } });
    return result;
  }

  async findAll(): Promise<FavoriteExerciseDto[]> {
    const results = await prisma.favoriteExercise.findMany({
      orderBy: { createdAt: "desc" },
    });
    return results;
  }

  async findByUserId(userId: string): Promise<FavoriteExerciseDto[]> {
    const results = await prisma.favoriteExercise.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return results;
  }

  async existsByUserAndExercise(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const count = await prisma.favoriteExercise.count({
      where: { userId, exerciseId },
    });
    return count > 0;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.favoriteExercise.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.favoriteExercise.count({ where: { id } });
    return count > 0;
  }
}
