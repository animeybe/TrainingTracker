// data/repositories/adapters/user.repository.ts
import { PrismaUserRepository } from "../prisma/prisma-user.repository";
import { UserMapper } from "../../mappers/user.mapper";
import {
  UserEntity,
  CreateUserEntity,
  UpdateUserEntity,
} from "../../../domain/entities/user.entity";
import { IUserRepository } from "../../../domain/repositories/i-user.repository";

export class UserRepositoryImpl implements IUserRepository {
  constructor(private prismaRepo: PrismaUserRepository) {}

  async create(entity: CreateUserEntity): Promise<UserEntity> {
    const dto = UserMapper.fromCreateEntity(entity);
    const dtoResult = await this.prismaRepo.create(dto);
    return UserMapper.toEntity(dtoResult);
  }

  async update(
    id: string,
    entity: UpdateUserEntity,
  ): Promise<UserEntity | null> {
    const dto = UserMapper.fromUpdateEntity(entity);
    const dtoResult = await this.prismaRepo.update(id, dto);
    if (!dtoResult) return null;
    return UserMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return UserMapper.toEntity(dto);
  }

  async findByLogin(login: string): Promise<UserEntity | null> {
    const dto = await this.prismaRepo.findByLogin(login);
    if (!dto) return null;
    return UserMapper.toEntity(dto);
  }

  async findByEmail(email: string | null): Promise<UserEntity | null> {
    if (!email) return null;
    const dto = await this.prismaRepo.findByEmail(email);
    if (!dto) return null;
    return UserMapper.toEntity(dto);
  }

  async findAll(): Promise<UserEntity[]> {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(UserMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.prismaRepo.exists(id);
  }
}
