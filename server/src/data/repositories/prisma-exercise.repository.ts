import {
  PrismaClient,
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "@prisma/client";
import { ExerciseDto, isExerciseDto } from "../types/exercise.dto";
import { ExerciseMapper } from "../mappers/exercise.mapper";
import { ExerciseId } from "../../common/types/ids";
import { IExerciseRepository } from "../../domain/repositories/i-exercise.repository";
import { Exercise } from "../../domain/entities/exercise";

export class PrismaExerciseRepository implements IExerciseRepository {
  private readonly mapper = new ExerciseMapper();
  constructor(private prisma: PrismaClient) {}

  async findById(id: ExerciseId): Promise<Exercise> {
    const dto = (await this.prisma.exercise.findUnique({
      where: { id: id.value },
    })) as ExerciseDto | null;
    if (!dto || !isExerciseDto(dto))
      throw new Error(`Exercise ${id.value} not found`);
    return this.mapper.toDomain(dto);
  }

  async findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]> {
    const dtos = (await this.prisma.exercise.findMany({
      where: { muscleGroup: muscle },
    })) as ExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }

  async findByType(type: ExerciseType): Promise<Exercise[]> {
    const dtos = (await this.prisma.exercise.findMany({
      where: { type },
    })) as ExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }

  async findByDifficulty(difficulty: Difficulty): Promise<Exercise[]> {
    const dtos = (await this.prisma.exercise.findMany({
      where: { difficulty },
    })) as ExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }

  async searchByName(name: string): Promise<Exercise[]> {
    const dtos = (await this.prisma.exercise.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
    })) as ExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }

  async getAll(): Promise<Exercise[]> {
    const dtos = (await this.prisma.exercise.findMany()) as ExerciseDto[];
    return this.mapper.toDomainMany(dtos);
  }
}
