import { prisma } from "../../infrastructure/prisma/client";
import {
  UserProfilePrismaDto,
  isUserProfilePrismaDto,
} from "../dto/profile.prisma-dto";
import { ProfileMapper } from "../mappers/profile.mapper";
import { UserId } from "../../common/types/ids";
import { IProfileRepository } from "../../domain/repositories/i-profile.repository";
import { Lifestyle, Goal } from "../../common/types/enums.types";
import { logger } from "../../common/utils";
import { UserProfile } from "../../domain/entities";

export class PrismaProfileRepository implements IProfileRepository {
  private readonly mapper = new ProfileMapper();

  async findByUserId(userId: UserId): Promise<UserProfile | null> {
    const prismaData = await prisma.userProfile.findUnique({
      where: { userId: userId.value },
    });

    if (!prismaData || !isUserProfilePrismaDto(prismaData)) {
      return null;
    }

    return this.mapper.toDomain(prismaData);
  }

  async createForDomain(profile: UserProfile): Promise<UserProfile> {
    const prismaData = (await prisma.userProfile.create({
      data: {
        userId: profile.userId.value,
        weight: profile.weight === -1 ? null : profile.weight,
        height: profile.height === -1 ? null : profile.height,
        age: profile.age === -1 ? null : profile.age,
        lifestyle: profile.lifestyle,
        goal: profile.goal,
      },
    })) as UserProfilePrismaDto;

    return this.mapper.toDomain(prismaData);
  }

  async create(data: {
    userId: string;
    weight?: number | null;
    height?: number | null;
    age?: number | null;
    lifestyle?: Lifestyle | null;
    goal?: Goal | null;
  }): Promise<UserProfile> {
    const prismaData = (await prisma.userProfile.create({
      data,
    })) as UserProfilePrismaDto;

    return this.mapper.toDomain(prismaData);
  }

  async update(
    userId: UserId,
    data: Partial<{
      weight: number | null;
      height: number | null;
      age: number | null;
      lifestyle: Lifestyle | null;
      goal: Goal | null;
    }>,
  ): Promise<UserProfile> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const prismaData = (await prisma.userProfile.upsert({
      where: { userId: userId.value },
      create: {
        userId: userId.value,
        weight: null,
        height: null,
        age: null,
        lifestyle: null,
        goal: null,
      },
      update: updateData,
    })) as UserProfilePrismaDto;

    return this.mapper.toDomain(prismaData);
  }

  async delete(userId: UserId): Promise<void> {
    await prisma.userProfile.delete({
      where: { userId: userId.value },
    });
  }
}
