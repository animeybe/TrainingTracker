// data/mappers/user.mapper.ts

import type {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
} from "../dtos/user.prisma-dto";

import type {
  UserEntity,
  CreateUserEntity,
  UpdateUserEntity,
} from "../../domain/entities/user.entity";

import type { user } from "@prisma/client";
import { Role } from "../../common/types/enums.types";

// 1️⃣ Маппер из Prisma → UserEntity
export function prismaUserToUserEntity(prismaUser: user): UserEntity {
  return {
    id: prismaUser.id,
    login: prismaUser.login,
    email: prismaUser.email,
    passwordHash: prismaUser.password!,
    role: prismaUser.role as Role,
    isActive: prismaUser.isActive,
    updatedAt: prismaUser.updatedAt,
    createdAt: prismaUser.createdAt,
  };
}

// 2️⃣ Маппер UserEntity ↔ UserDto
export class UserMapper {
  static toEntity(dto: UserDto): UserEntity {
    return {
      id: dto.id,
      login: dto.login,
      email: dto.email,
      passwordHash: dto.passwordHash,
      role: dto.role,
      isActive: dto.isActive,
      updatedAt: dto.updatedAt,
      createdAt: dto.createdAt,
    };
  }

  static toDto(entity: UserEntity): UserDto {
    return {
      id: entity.id,
      login: entity.login,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      isActive: entity.isActive,
      updatedAt: entity.updatedAt,
      createdAt: entity.createdAt,
    };
  }

  static fromCreateEntity(entity: CreateUserEntity): CreateUserDto {
    return {
      login: entity.login,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      isActive: entity.isActive,
    };
  }

  static fromUpdateEntity(entity: UpdateUserEntity): UpdateUserDto {
    return {
      login: entity.login,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      isActive: entity.isActive,
    };
  }
}
