// data/mappers/user-state.mapper.ts

import type {
  UserStateDto,
  CreateUserStateDto,
  UpdateUserStateDto,
} from "../dtos/user-state.prisma-dto";

import type {
  UserStateEntity,
  CreateUserStateEntity,
  UpdateUserStateEntity,
} from "../../domain/entities/user-state.entity";

import type { userState } from "@prisma/client";

// 1️⃣ Prisma → Entity
export function prismaUserStateToUserStateEntity(
  prismaUserState: userState,
): UserStateEntity {
  return {
    id: prismaUserState.id,
    userId: prismaUserState.userId,
    currentWeek: prismaUserState.currentWeek,
    createdAt: prismaUserState.createdAt,
    updatedAt: prismaUserState.updatedAt,
  };
}

// 2️⃣ Entity ↔ DTO
export class UserStateMapper {
  static toEntity(dto: UserStateDto): UserStateEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      currentWeek: dto.currentWeek,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toDto(entity: UserStateEntity): UserStateDto {
    return {
      id: entity.id,
      userId: entity.userId,
      currentWeek: entity.currentWeek,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromCreateEntity(entity: CreateUserStateEntity): CreateUserStateDto {
    return {
      userId: entity.userId,
      currentWeek: entity.currentWeek,
    };
  }

  static fromUpdateEntity(entity: UpdateUserStateEntity): UpdateUserStateDto {
    return {
      currentWeek: entity.currentWeek,
    };
  }
}
