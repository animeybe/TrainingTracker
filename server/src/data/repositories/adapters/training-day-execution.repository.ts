// data/repositories/adapters/training-day-execution.repository.ts
import { PrismaTrainingDayExecutionRepository } from "../prisma/prisma-training-day-execution.repository";
import { TrainingDayExecutionMapper } from "../../mappers/training-day-execution.mapper";
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../../../domain/entities/training-day-execution.entity";
import type { ITrainingDayExecutionRepository } from "../../../domain/repositories/i-training-day-execution.repository";

export class TrainingDayExecutionRepositoryImpl implements ITrainingDayExecutionRepository {
  constructor(
    private readonly prismaRepo: PrismaTrainingDayExecutionRepository,
  ) {}

  async create(
    entity: CreateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity> {
    const dto = TrainingDayExecutionMapper.fromCreateEntity(entity);
    const result = await this.prismaRepo.create(dto);
    return TrainingDayExecutionMapper.toEntity(result);
  }

  async findById(id: string): Promise<TrainingDayExecutionEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return TrainingDayExecutionMapper.toEntity(dto);
  }

  async findByUserId(userId: string): Promise<TrainingDayExecutionEntity[]> {
    const dtos = await this.prismaRepo.findByUserId(userId);
    return dtos.map(TrainingDayExecutionMapper.toEntity);
  }

  async findByWeekAndDay(
    userId: string,
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecutionEntity[]> {
    const dtos = await this.prismaRepo.findByWeekAndDay(
      userId,
      week,
      dayOfWeek,
    );
    return dtos.map(TrainingDayExecutionMapper.toEntity);
  }

  async update(
    id: string,
    entity: UpdateTrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null> {
    const dto = TrainingDayExecutionMapper.fromUpdateEntity(entity);
    const result = await this.prismaRepo.update(id, dto);
    if (!result) return null;
    return TrainingDayExecutionMapper.toEntity(result);
  }

  async finishTraining(id: string): Promise<TrainingDayExecutionEntity | null> {
    const result = await this.prismaRepo.finishTraining(id);
    if (!result) return null;
    return TrainingDayExecutionMapper.toEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async findAbandoned(before: Date): Promise<TrainingDayExecutionEntity[]> {
    const dtos = await this.prismaRepo.findAbandoned(before);
    return dtos.map(TrainingDayExecutionMapper.toEntity);
  }
}
