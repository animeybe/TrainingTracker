// data/repositories/adapters/training-exercise-execution.repository.ts
import { PrismaTrainingExerciseExecutionRepository } from "../prisma/prisma-training-exercise-execution.repository";
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../../../domain/entities/training-exercise-execution.entity";
import { TrainingExerciseExecutionMapper } from "../../mappers/training-exercise-execution.mapper";
import type { ITrainingExerciseExecutionRepository } from "../../../domain/repositories/i-training-exercise-execution.repository";

export class TrainingExerciseExecutionRepositoryImpl implements ITrainingExerciseExecutionRepository {
  constructor(
    private readonly prismaRepo: PrismaTrainingExerciseExecutionRepository,
  ) {}

  async create(
    entity: TrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity> {
    const dto = TrainingExerciseExecutionMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return TrainingExerciseExecutionMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: TrainingExerciseExecutionEntity,
  ): Promise<TrainingExerciseExecutionEntity | null> {
    const dto = TrainingExerciseExecutionMapper.toDto(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) return null;
    return TrainingExerciseExecutionMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<TrainingExerciseExecutionEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return TrainingExerciseExecutionMapper.toEntity(dto);
  }

  async findByExecutionId(
    executionId: string,
  ): Promise<TrainingExerciseExecutionEntity[]> {
    const dtoList = await this.prismaRepo.findByExecutionId(executionId);
    return dtoList.map(TrainingExerciseExecutionMapper.toEntity);
  }

  async findAll(): Promise<TrainingExerciseExecutionEntity[]> {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(TrainingExerciseExecutionMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }
}
