// data/repositories/adapters/training-exercise-execution.repository.ts
import { PrismaTrainingExerciseExecutionRepository } from "../prisma/prisma-training-exercise-execution.repository";
import { TrainingExerciseExecutionMapper } from "../../mappers/training-exercise-execution.mapper";
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../../../domain/entities/training-exercise-execution.entity";
import type { ITrainingExerciseExecutionRepository } from "../../../domain/repositories/i-training-exercise-execution.repository";

export class TrainingExerciseExecutionRepositoryImpl implements ITrainingExerciseExecutionRepository {
  constructor(
    private readonly prismaRepo: PrismaTrainingExerciseExecutionRepository,
  ) {}

  async create(
    entity: CreateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity> {
    const dto = TrainingExerciseExecutionMapper.fromCreateEntity(entity);
    const result = await this.prismaRepo.create(dto);
    return TrainingExerciseExecutionMapper.toEntity(result);
  }

  async findById(id: string): Promise<TrainingExerciseExecutionEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return TrainingExerciseExecutionMapper.toEntity(dto);
  }

  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]> {
    const dtos = await this.prismaRepo.findByExecutionId(executionId);
    return dtos.map(TrainingExerciseExecutionMapper.toEntity);
  }

  async findAll(): Promise<TrainingExerciseExecutionEntity[]> {
    const dtos = await this.prismaRepo.findAll();
    return dtos.map(TrainingExerciseExecutionMapper.toEntity);
  }

  async update(
    id: string,
    entity: UpdateTrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null> {
    const dto = TrainingExerciseExecutionMapper.fromUpdateEntity(entity);
    const result = await this.prismaRepo.update(id, dto as any);
    if (!result) return null;
    return TrainingExerciseExecutionMapper.toEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }
}
