import { prisma } from "../../../infrastructure/prisma/client";
import type {
  LeastFavoriteExerciseDto,
  CreateLeastFavoriteExerciseDto,
} from "../../dtos/least-favorite-exercise.prisma-dto";

export class PrismaLeastFavoriteExerciseRepository {
  async create(
    data: CreateLeastFavoriteExerciseDto,
  ): Promise<LeastFavoriteExerciseDto> {
    const result = await prisma.leastFavoriteExercise.create({ data });
    return result;
  }

  async findById(id: string): Promise<LeastFavoriteExerciseDto | null> {
    const result = await prisma.leastFavoriteExercise.findUnique({
      where: { id },
    });
    return result;
  }

  async findAll(): Promise<LeastFavoriteExerciseDto[]> {
    const results = await prisma.leastFavoriteExercise.findMany({
      orderBy: { createdAt: "desc" },
    });
    return results;
  }

  async findByUserId(userId: string): Promise<LeastFavoriteExerciseDto[]> {
    const results = await prisma.leastFavoriteExercise.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return results;
  }

  async existsByUserAndExercise(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const count = await prisma.leastFavoriteExercise.count({
      where: { userId, exerciseId },
    });
    return count > 0;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.leastFavoriteExercise.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.leastFavoriteExercise.count({ where: { id } });
    return count > 0;
  }
}
