import { PrismaLeastFavoriteExerciseRepository } from "../prisma/prisma-least-favorite-exercise.repository";
import { LeastFavoriteExerciseMapper } from "../../mappers/least-favorite-exercise.mapper";
import { ILeastFavoriteExerciseRepository } from "../../../domain/repositories/i-least-favorite-exercise.repository";
import { LeastFavoriteExerciseEntity } from "../../../domain/entities/least-favorite-exercise.entity";

export class LeastFavoriteExerciseRepositoryImpl implements ILeastFavoriteExerciseRepository {
  constructor(
    private readonly prismaRepo: PrismaLeastFavoriteExerciseRepository,
  ) {}

  async create(
    entity: LeastFavoriteExerciseEntity,
  ): Promise<LeastFavoriteExerciseEntity> {
    const dto = LeastFavoriteExerciseMapper.toDto(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return LeastFavoriteExerciseMapper.toEntity(dtoResult);
  }

  async findByUserId(userId: string): Promise<LeastFavoriteExerciseEntity[]> {
    const dtoList = await this.prismaRepo.findByUserId(userId);
    return dtoList.map(LeastFavoriteExerciseMapper.toEntity);
  }

  async delete(entity: LeastFavoriteExerciseEntity): Promise<boolean> {
    if (!entity.id) return false;
    return await this.prismaRepo.delete(entity.id);
  }

  async exists(userId: string, exerciseId: string): Promise<boolean> {
    return await this.prismaRepo.existsByUserAndExercise(userId, exerciseId);
  }

  async deleteByComposite(
    userId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const dtos = await this.prismaRepo.findByUserId(userId);
    const target = dtos.find((dto) => dto.exerciseId === exerciseId);

    if (!target?.id) return false;

    return await this.prismaRepo.delete(target.id);
  }
}
