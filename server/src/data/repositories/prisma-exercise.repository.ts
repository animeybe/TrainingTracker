import { prisma } from "../../infrastructure/prisma/client";
import {
  ExercisePrismaDto,
  isExercisePrismaDto,
} from "../dto/exercise.prisma-dto";
import { ExerciseMapper } from "../mappers/exercise.mapper";
import { ExerciseId } from "../../common/types/ids";
import { IExerciseRepository } from "../../domain/repositories/i-exercise.repository";
import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";
import { logger } from "../../common/utils";
import { Exercise } from "../../domain";

export class PrismaExerciseRepository implements IExerciseRepository {
  private readonly mapper = new ExerciseMapper();

  async findById(id: ExerciseId): Promise<Exercise> {
    const prismaData = await prisma.exercise.findUnique({
      where: { id: id.value },
    });

    if (!prismaData || !isExercisePrismaDto(prismaData)) {
      logger.warn(`Exercise not found: ${id.value}`);
      throw new Error(`Exercise ${id.value} not found`);
    }

    return this.mapper.toDomain(prismaData);
  }

  async findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]> {
    const prismaData = (await prisma.exercise.findMany({
      where: { muscleGroup: muscle },
    })) as ExercisePrismaDto[];

    return this.mapper.toDomainMany(prismaData);
  }

  async findByType(type: ExerciseType): Promise<Exercise[]> {
    const prismaData = (await prisma.exercise.findMany({
      where: { type },
    })) as ExercisePrismaDto[];

    return this.mapper.toDomainMany(prismaData);
  }

  async findByDifficulty(difficulty: Difficulty): Promise<Exercise[]> {
    const prismaData = (await prisma.exercise.findMany({
      where: { difficulty },
    })) as ExercisePrismaDto[];

    return this.mapper.toDomainMany(prismaData);
  }

  async searchByName(name: string): Promise<Exercise[]> {
    if (!name || name.trim().length === 0) {
      return [];
    }

    const prismaData = (await prisma.exercise.findMany({
      where: {
        name: {
          contains: name.trim(),
          mode: "insensitive",
        },
      },
    })) as ExercisePrismaDto[];

    return this.mapper.toDomainMany(prismaData);
  }

  async getAll(): Promise<Exercise[]> {
    const prismaData =
      (await prisma.exercise.findMany()) as ExercisePrismaDto[];
    return this.mapper.toDomainMany(prismaData);
  }
}
