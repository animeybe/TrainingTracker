// data/mappers/user-profile.mapper.ts
import type {
  UserProfileDto,
  CreateUserProfileDto,
  UpdateUserProfileDto,
} from "../dtos/user-profile.prisma-dto";
import type {
  UserProfileEntity,
  CreateUserProfileEntity,
  UpdateUserProfileEntity,
} from "../../domain/entities/user-profile.entity";

export class UserProfileMapper {
  static toEntity(dto: UserProfileDto): UserProfileEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      weight: dto.weight,
      height: dto.height,
      gender: dto.gender,
      age: dto.age,
      lifestyle: dto.lifestyle,
      goal: dto.goal,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toDto(entity: UserProfileEntity): UserProfileDto {
    return {
      id: entity.id,
      userId: entity.userId,
      weight: entity.weight,
      height: entity.height,
      gender: entity.gender,
      age: entity.age,
      lifestyle: entity.lifestyle,
      goal: entity.goal,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromCreateEntity(
    entity: CreateUserProfileEntity,
  ): CreateUserProfileDto {
    return {
      userId: entity.userId,
      weight: entity.weight,
      height: entity.height,
      gender: entity.gender,
      age: entity.age,
      lifestyle: entity.lifestyle,
      goal: entity.goal,
    };
  }

  static fromUpdateEntity(
    entity: UpdateUserProfileEntity,
  ): UpdateUserProfileDto {
    return {
      weight: entity.weight,
      height: entity.height,
      gender: entity.gender,
      age: entity.age,
      lifestyle: entity.lifestyle,
      goal: entity.goal,
    };
  }
}
