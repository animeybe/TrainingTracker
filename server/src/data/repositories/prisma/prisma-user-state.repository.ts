// data/repositories/prisma/prisma-user-state.repository.ts

import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";
import {
  UserStateDto,
  CreateUserStateDto,
  UpdateUserStateDto,
} from "../../dtos/user-state.prisma-dto";
import { UserStateMapper } from "../../mappers/user-state.mapper";
import { logger } from "../../../common/utils";

export class PrismaUserStateRepository {
  async create(data: CreateUserStateDto): Promise<UserStateDto> {
    const result = await prisma.userState.create({
      data: {
        user: { connect: { id: data.userId } },
        currentWeek: data.currentWeek ?? 1,
      } satisfies Prisma.userStateCreateInput,
    });
    return UserStateMapper.toDto(result);
  }

  async findById(id: string): Promise<UserStateDto | null> {
    const result = await prisma.userState.findUnique({ where: { id } });
    return result ? UserStateMapper.toDto(result) : null;
  }

  async findByUserId(userId: string): Promise<UserStateDto | null> {
    const result = await prisma.userState.findFirst({ where: { userId } });
    return result ? UserStateMapper.toDto(result) : null;
  }

  async findAll(): Promise<UserStateDto[]> {
    const results = await prisma.userState.findMany();
    return results.map(UserStateMapper.toDto);
  }

  async upsert(
    userId: string,
    data: UpdateUserStateDto,
  ): Promise<UserStateDto> {
    const input: Prisma.userStateUpsertArgs = {
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        currentWeek: data.currentWeek ?? 1,
      },
      update: {
        currentWeek: data.currentWeek,
      },
    };

    const result = await prisma.userState.upsert(input);
    return UserStateMapper.toDto(result);
  }

  async update(id: string, data: UpdateUserStateDto): Promise<UserStateDto> {
    const result = await prisma.userState.update({
      where: { id },
      data: {
        currentWeek: data.currentWeek,
      },
    });
    return UserStateMapper.toDto(result);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.userState.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.userState.count({ where: { id } });
    return count > 0;
  }
}
