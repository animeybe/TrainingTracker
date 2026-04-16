// data/repositories/adapters/profile.repository.ts
import { PrismaProfileRepository } from "../prisma/prisma-user-profile.repository";
import { UserProfileMapper } from "../../mappers/user-profile.mapper";
import { UserProfileEntity } from "../../../domain/entities/user-profile.entity";
import { IProfileRepository } from "../../../domain/repositories/i-profile.repository";

export class ProfileRepositoryImpl implements IProfileRepository {
  constructor(private prismaRepo: PrismaProfileRepository) {}

  async create(data: UserProfileEntity): Promise<UserProfileEntity> {
    const dto = UserProfileMapper.toDto(data);
    const dtoResult = await this.prismaRepo.create(dto);
    return UserProfileMapper.toEntity(dtoResult);
  }

  async update(
    userId: string,
    data: Partial<UserProfileEntity>,
  ): Promise<UserProfileEntity | null> {
    const dto = {
      userId,
      weight: data.weight,
      height: data.height,
      age: data.age,
      lifestyle: data.lifestyle,
      goal: data.goal,
    };
    const dtoResult = await this.prismaRepo.update(userId, dto);
    if (!dtoResult) return null;
    return UserProfileMapper.toEntity(dtoResult);
  }

  async findById(id: string): Promise<UserProfileEntity | null> {
    const dto = await this.prismaRepo.findById(id);
    if (!dto) return null;
    return UserProfileMapper.toEntity(dto);
  }

  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const dto = await this.prismaRepo.findByUserId(userId);
    if (!dto) return null;
    return UserProfileMapper.toEntity(dto);
  }

  async findAll(): Promise<UserProfileEntity[]> {
    const dtoList = await this.prismaRepo.findAll();
    return dtoList.map(UserProfileMapper.toEntity);
  }

  async delete(id: string): Promise<boolean> {
    return await this.prismaRepo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.prismaRepo.exists(id);
  }
}
