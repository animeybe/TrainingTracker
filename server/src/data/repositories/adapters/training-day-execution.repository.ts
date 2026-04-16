// data/repositories/adapters/training-day-execution.repository.ts
import { PrismaTrainingDayExecutionRepository } from "../prisma/prisma-training-day-execution.repository";
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../../../domain/entities/training-day-execution.entity";
import { TrainingDayExecutionMapper } from "../../mappers/training-day-execution.mapper";
import type { ITrainingDayExecutionRepository } from "../../../domain/repositories/i-training-day-execution.repository";

export class TrainingDayExecutionRepositoryImpl implements ITrainingDayExecutionRepository {
  constructor(
    private readonly prismaRepo: PrismaTrainingDayExecutionRepository,
  ) {}

  async create(
    entity: TrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity> {
    const dto = TrainingDayExecutionMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return TrainingDayExecutionMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: TrainingDayExecutionEntity,
  ): Promise<TrainingDayExecutionEntity | null> {
    const dto = TrainingDayExecutionMapper.toDto(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) return null;
    return TrainingDayExecutionMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<TrainingDayExecutionEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return TrainingDayExecutionMapper.toEntity(dto);
  }

  async findByWeekDayAndUser(
    userId: string,
    week: number,
    dayOfWeek: number,
    executionDate: Date,
  ): Promise<TrainingDayExecutionEntity | null> {
    const dto = await this.prismaRepo.findByWeekDayAndUser(
      userId,
      week,
      dayOfWeek,
      executionDate,
    );
    if (!dto) return null;
    return TrainingDayExecutionMapper.toEntity(dto);
  }

  async findAll(): Promise<TrainingDayExecutionEntity[]> {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(TrainingDayExecutionMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }
}
