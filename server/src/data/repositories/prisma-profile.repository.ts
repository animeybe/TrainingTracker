import { PrismaClient, Lifestyle, Goal } from "@prisma/client";
import { UserProfileDto, isUserProfileDto } from "../types/profile.dto";
import { ProfileMapper } from "../mappers/profile.mapper";
import { UserId } from "../../common/types/ids";
import { IProfileRepository } from "../../domain/repositories/i-profile.repository";
import { UserProfile } from "../../domain/entities/user-profile";

export class PrismaProfileRepository implements IProfileRepository {
  private readonly mapper = new ProfileMapper();
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: UserId): Promise<UserProfile> {
    const dto = (await this.prisma.userProfile.findUnique({
      where: { userId: userId.value },
    })) as UserProfileDto | null;

    if (!dto || !isUserProfileDto(dto)) {
      throw new Error(`Profile for user ${userId.value} not found`);
    }
    return this.mapper.toDomain(dto); // ✅ Domain Entity класс!
  }

  async create(data: {
    userId: string;
    weight?: number | null;
    height?: number | null;
    age?: number | null;
    lifestyle?: Lifestyle | null;
    goal?: Goal | null;
  }): Promise<UserProfile> {
    const dto = (await this.prisma.userProfile.create({
      data,
    })) as UserProfileDto;
    return this.mapper.toDomain(dto);
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
    const dto = (await this.prisma.userProfile.upsert({
      where: { userId: userId.value },
      create: { userId: userId.value, weight: null, height: null, age: null },
      update: data,
    })) as UserProfileDto;
    return this.mapper.toDomain(dto);
  }

  async delete(userId: UserId): Promise<void> {
    await this.prisma.userProfile.delete({ where: { userId: userId.value } });
  }
}
