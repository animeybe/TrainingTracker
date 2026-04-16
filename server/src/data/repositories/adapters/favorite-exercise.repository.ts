import { PrismaFavoriteExerciseRepository } from "../prisma/prisma-favorite-exercise.repository";
import { FavoriteExerciseMapper } from "../../mappers/favorite-exercise.mapper";
import { IFavoriteExerciseRepository } from "../../../domain/repositories/i-favorite-exercise.repository";
import { FavoriteExerciseEntity } from "../../../domain/entities/favorite-exercise.entity";

export class FavoriteExerciseRepositoryImpl implements IFavoriteExerciseRepository {
  constructor(private readonly prismaRepo: PrismaFavoriteExerciseRepository) {}

  async create(
    entity: FavoriteExerciseEntity,
  ): Promise<FavoriteExerciseEntity> {
    const dto = FavoriteExerciseMapper.toDto(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return FavoriteExerciseMapper.toEntity(dtoResult);
  }

  async findByUserId(userId: string): Promise<FavoriteExerciseEntity[]> {
    const dtoList = await this.prismaRepo.findByUserId(userId);
    return dtoList.map(FavoriteExerciseMapper.toEntity);
  }

  async delete(entity: FavoriteExerciseEntity): Promise<boolean> {
    if (!entity.id) return false;
    return await this.prismaRepo.delete(entity.id);
  }

  async exists(userId: string, exerciseId: string): Promise<boolean> {
    return await this.prismaRepo.existsByUserAndExercise(userId, exerciseId);
  }
}
