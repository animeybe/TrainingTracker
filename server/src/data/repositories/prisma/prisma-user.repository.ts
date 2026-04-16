// data/repositories/prisma/prisma-user.repository.ts

import { Prisma, user as PrismaUser } from "@prisma/client";

import { Role } from "../../../common/types/enums.types";

import { prisma } from "../../../infrastructure/prisma/client";

import type {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
} from "../../dtos/user.prisma-dto";

import { UserMapper } from "../../mappers/user.mapper";

import type { BaseRepository } from "../common/base-prisma-repository";
import { UserEntity } from "../../../domain";

// Тип для результата Prisma User
type PrismaUserType = Pick<
  PrismaUser,
  | "id"
  | "login"
  | "email"
  | "password"
  | "role"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

// Функция маппинга Prisma User → UserEntity
function toUserEntity(prismaUser: PrismaUserType): UserEntity {
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

// 1️️. Create
export class PrismaUserRepository implements BaseRepository<
  CreateUserDto,
  UpdateUserDto,
  UserDto
> {
  async create(data: CreateUserDto): Promise<UserDto> {
    const result = await prisma.user.create({
      data: {
        login: data.login,
        email: data.email,
        password: data.passwordHash,
        role: data.role,
        isActive: data.isActive,
      } satisfies Prisma.userCreateInput,
    });

    const userEntity = toUserEntity(result);
    return UserMapper.toDto(userEntity);
  }

  // 2️️. FindById
  async findById(id: string): Promise<UserDto | null> {
    const result = await prisma.user.findUnique({ where: { id } });

    if (!result) return null;

    const userEntity = toUserEntity(result);
    return UserMapper.toDto(userEntity);
  }

  // 3️️. FindByLogin
  async findByLogin(login: string): Promise<UserDto | null> {
    const result = await prisma.user.findUnique({ where: { login } });

    if (!result) return null;

    const userEntity = toUserEntity(result);
    return UserMapper.toDto(userEntity);
  }

  // 4️️. FindByEmail
  async findByEmail(email: string): Promise<UserDto | null> {
    if (!email) return null;

    const result = await prisma.user.findUnique({ where: { email } });

    if (!result) return null;

    const userEntity = toUserEntity(result);
    return UserMapper.toDto(userEntity);
  }

  // 5️️. FindAll
  async findAll(): Promise<UserDto[]> {
    const results = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return results.map((prismaUser) => {
      const userEntity = toUserEntity(prismaUser);
      return UserMapper.toDto(userEntity);
    });
  }

  // 6️️. Update
  async update(id: string, data: UpdateUserDto): Promise<UserDto | null> {
    try {
      const result = await prisma.user.update({
        where: { id },
        data: {
          login: data.login,
          email: data.email,
          password: data.passwordHash,
          role: data.role,
          isActive: data.isActive,
        } satisfies Prisma.userUpdateInput,
      });

      const userEntity = toUserEntity(result);
      return UserMapper.toDto(userEntity);
    } catch {
      return null;
    }
  }

  // 7️️. Delete
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // 8️️. Exists
  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { id } });
    return count > 0;
  }
}
