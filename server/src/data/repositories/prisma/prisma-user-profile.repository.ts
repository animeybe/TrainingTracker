import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";
import {
  UserProfileDto,
  CreateUserProfileDto,
  UpdateUserProfileDto,
} from "../../dtos/user-profile.prisma-dto";
import { UserProfileMapper } from "../../mappers/user-profile.mapper";
import { BaseRepository } from "../common/base-prisma-repository";
import { logger } from "../../../common/utils";

export class PrismaProfileRepository implements BaseRepository<
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileDto
> {
  async create(data: CreateUserProfileDto): Promise<UserProfileDto> {
    const result = await prisma.userProfile.create({
      data: {
        user: {
          connect: { id: data.userId },
        },
        weight: data.weight,
        height: data.height,
        age: data.age,
        lifestyle: data.lifestyle,
        goal: data.goal,
      } satisfies Prisma.userProfileCreateInput,
    });
    return UserProfileMapper.toDto(result);
  }

  async findById(id: string): Promise<UserProfileDto | null> {
    const result = await prisma.userProfile.findUnique({ where: { id } });
    return result ? UserProfileMapper.toDto(result) : null;
  }

  async findByUserId(userId: string): Promise<UserProfileDto | null> {
    const result = await prisma.userProfile.findFirst({
      where: { userId },
    });
    return result ? UserProfileMapper.toDto(result) : null;
  }

  async findAll(): Promise<UserProfileDto[]> {
    const results = await prisma.userProfile.findMany();
    return results.map(UserProfileMapper.toDto);
  }

  async update(
    userId: string,
    data: UpdateUserProfileDto,
  ): Promise<UserProfileDto | null> {
    try {
      const result = await prisma.userProfile.upsert({
        where: { userId },
        update: {
          weight: data.weight,
          height: data.height,
          age: data.age,
          lifestyle: data.lifestyle,
          goal: data.goal,
        },
        create: {
          userId,
          weight: data.weight,
          height: data.height,
          age: data.age,
          lifestyle: data.lifestyle,
          goal: data.goal,
        },
      });
      return UserProfileMapper.toDto(result);
    } catch (error) {
      logger.error("Profile upsert failed", { userId, error });
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.userProfile.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.userProfile.count({ where: { id } });
    return count > 0;
  }
}
