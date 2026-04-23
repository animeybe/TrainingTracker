// data/repositories/adapters/user-state.repository.ts

import { PrismaUserStateRepository } from "../prisma/prisma-user-state.repository";
import { UserStateMapper } from "../../mappers/user-state.mapper";
import {
  UserStateEntity,
  CreateUserStateEntity,
  UpdateUserStateEntity,
} from "../../../domain/entities/user-state.entity";
import { IUserStateRepository } from "../../../domain/repositories/i-user-state.repository";
import { UpdateUserStateDto } from "../../dtos/user-state.prisma-dto";

export class UserStateRepositoryImpl implements IUserStateRepository {
  constructor(private prismaRepo: PrismaUserStateRepository) {}

  async create(entity: CreateUserStateEntity): Promise<UserStateEntity> {
    const dto = UserStateMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return UserStateMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: UpdateUserStateEntity,
  ): Promise<UserStateEntity | null> {
    const dto = UserStateMapper.fromUpdateEntity(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    return UserStateMapper.toEntity(dtoResult);
  }

  async updateCurrentWeek(
    userId: string,
    newWeek: number,
  ): Promise<UserStateEntity | null> {
    const dto: UpdateUserStateDto = { currentWeek: newWeek };
    const dtoResult = await this.prismaRepo.upsert(userId, dto);
    return UserStateMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<UserStateEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return UserStateMapper.toEntity(dto);
  }

  async findByUserId(userId: string): Promise<UserStateEntity | null> {
    const dto = await this.prismaRepo.findByUserId(userId);
    if (!dto) return null;
    return UserStateMapper.toEntity(dto);
  }

  async findAll(): Promise<UserStateEntity[]> {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(UserStateMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.prismaRepo.exists(id);
  }
}
