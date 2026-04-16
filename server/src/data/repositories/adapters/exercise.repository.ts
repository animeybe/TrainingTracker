// data/repositories/interfaces/exercise.repository.ts
import { PrismaExerciseRepository } from "../prisma/prisma-exercise.repository";
import { ExerciseMapper } from "../../mappers/exercise.mapper";
import { IExerciseRepository } from "../../../domain/repositories/i-exercise.repository";
import {
  ExerciseEntity,
  CreateExerciseEntity,
  UpdateExerciseEntity,
} from "../../../domain/entities/exercise.entity";

export class ExerciseRepositoryImpl implements IExerciseRepository {
  constructor(private readonly prismaRepo: PrismaExerciseRepository) {}

  async create(entity: CreateExerciseEntity): Promise<ExerciseEntity> {
    const dto = ExerciseMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return ExerciseMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: UpdateExerciseEntity,
  ): Promise<ExerciseEntity | null> {
    const dto = ExerciseMapper.fromUpdateEntity(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) return null;
    return ExerciseMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<ExerciseEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return ExerciseMapper.toEntity(dto);
  }

  async findManyByIds(ids: string[]): Promise<ExerciseEntity[]> {
    const dtoList = await this.prismaRepo.findManyByIds(ids);
    return dtoList.map(ExerciseMapper.toEntity);
  }

  async findAll(): Promise<ExerciseEntity[] > {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(ExerciseMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }
}
