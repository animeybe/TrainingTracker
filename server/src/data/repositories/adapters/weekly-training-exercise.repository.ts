import { PrismaWeeklyTrainingExerciseRepository } from "../prisma/prisma-weekly-training-exercise.repository";
import { WeeklyTrainingExerciseMapper } from "../../mappers/weekly-training-exercise.mapper";
import type {
  WeeklyTrainingExerciseEntity,
  CreateWeeklyTrainingExerciseEntity,
} from "../../../domain/entities/weekly-training-exercise.entity";
import type { IWeeklyTrainingExerciseRepository } from "../../../domain/repositories/i-weekly-training-exercise.repository";

export class WeeklyTrainingExerciseRepositoryImpl implements IWeeklyTrainingExerciseRepository {
  constructor(
    private readonly prismaRepo: PrismaWeeklyTrainingExerciseRepository,
  ) {}

  async create(
    entity: CreateWeeklyTrainingExerciseEntity,
  ): Promise<WeeklyTrainingExerciseEntity> {
    const dto = WeeklyTrainingExerciseMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return WeeklyTrainingExerciseMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: WeeklyTrainingExerciseEntity,
  ): Promise<WeeklyTrainingExerciseEntity | null> {
    const dto = WeeklyTrainingExerciseMapper.toDto(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) return null;
    return WeeklyTrainingExerciseMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<WeeklyTrainingExerciseEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return WeeklyTrainingExerciseMapper.toEntity(dto);
  }

  async findByPlanId(planId: string): Promise<WeeklyTrainingExerciseEntity[]> {
    const dtoList = await this.prismaRepo.findByPlanId(planId);
    return dtoList.map(WeeklyTrainingExerciseMapper.toEntity);
  }

  async deleteAllByPlanId(planId: string): Promise<void> {
    await this.prismaRepo.deleteAllByPlanId(planId);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }
}
