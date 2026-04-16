// data/repositories/prisma/prisma-exercise.repository.ts
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  ExerciseDto,
  CreateExerciseDto,
  UpdateExerciseDto,
} from "../../dtos/exercise.prisma-dto";
import { ExerciseMapper } from "../../mappers/exercise.mapper";

export class PrismaExerciseRepository {
  async create(data: CreateExerciseDto): Promise<ExerciseDto> {
    const result = await prisma.exercise.create({ data });
    return result;
  }

  async findById(id: string): Promise<ExerciseDto | null> {
    const result = await prisma.exercise.findUnique({ where: { id } });
    return result;
  }

  async findManyByIds(ids: string[]): Promise<ExerciseDto[]> {
    const results = await prisma.exercise.findMany({
      where: { id: { in: ids } },
      orderBy: { name: "asc" },
    });
    return results;
  }

  async findAll(): Promise<ExerciseDto[]> {
    const results = await prisma.exercise.findMany({
      orderBy: { name: "asc" },
    });
    return results;
  }

  async update(
    id: string,
    data: UpdateExerciseDto,
  ): Promise<ExerciseDto | null> {
    try {
      const result = await prisma.exercise.update({
        where: { id },
        data,
      });
      return ExerciseMapper.toDto(result);
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.exercise.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.exercise.count({ where: { id } });
    return count > 0;
  }
}
