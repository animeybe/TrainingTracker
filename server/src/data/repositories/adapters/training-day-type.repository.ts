import { PrismaTrainingDayTypeRepository } from "../prisma/prisma-training-day-type.repository";
import { TrainingDayTypeMapper } from "../../mappers/training-day-type.mapper";
import type { ITrainingDayTypeRepository } from "../../../domain/repositories/i-training-day-type.repository";
import type { TrainingDayTypeEntity, CreateTrainingDayTypeEntity, UpdateTrainingDayTypeEntity } from "../../../domain/entities/training-day-type.entity";

export class TrainingDayTypeRepositoryImpl implements ITrainingDayTypeRepository {
  constructor(private readonly prismaRepo: PrismaTrainingDayTypeRepository) {}

  async create(entity: CreateTrainingDayTypeEntity): Promise<TrainingDayTypeEntity> {
    const dto = TrainingDayTypeMapper.fromCreateEntity(entity);
    const result = await this.prismaRepo.create(dto);
    return TrainingDayTypeMapper.toEntity(result);
  }

  async update(id: string, entity: UpdateTrainingDayTypeEntity): Promise<TrainingDayTypeEntity | null> {
    const dto = TrainingDayTypeMapper.fromUpdateEntity(entity);
    const result = await this.prismaRepo.update(id, dto);
    return result ? TrainingDayTypeMapper.toEntity(result) : null;
  }

  async findById(id: string): Promise<TrainingDayTypeEntity | null> {
    const result = await this.prismaRepo.findById(id);
    return result ? TrainingDayTypeMapper.toEntity(result) : null;
  }

  async findByPlanId(planId: string): Promise<TrainingDayTypeEntity[]> {
    const results = await this.prismaRepo.findByPlanId(planId);
    return results.map(TrainingDayTypeMapper.toEntity);
  }

  async findByPlanIdAndDay(planId: string, dayOfWeek: number): Promise<TrainingDayTypeEntity | null> {
    const result = await this.prismaRepo.findByPlanIdAndDay(planId, dayOfWeek);
    return result ? TrainingDayTypeMapper.toEntity(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async upsert(planId: string, dayOfWeek: number, dayType: string): Promise<TrainingDayTypeEntity> {
    const result = await this.prismaRepo.upsert(planId, dayOfWeek, dayType);
    return TrainingDayTypeMapper.toEntity(result);
  }
}
