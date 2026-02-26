import {
  UserProfilePrismaDto,
  isUserProfilePrismaDto,
} from "../dto/profile.prisma-dto";
import { UserProfile } from "../../domain/entities/user-profile.entity";
import { UserId } from "../../common/types/ids";
import { BaseMapper } from "../common/base.mapper";

export class ProfileMapper extends BaseMapper<
  UserProfilePrismaDto,
  UserProfile
> {
  protected doMap(prismaDto: UserProfilePrismaDto): UserProfile {
    // ✅ reconstitute с guard clauses
    return UserProfile.reconstitute({
      userId: UserId.create(prismaDto.userId),
      weight: prismaDto.weight ?? -1,
      height: prismaDto.height ?? -1,
      age: prismaDto.age ?? -1,
      lifestyle: prismaDto.lifestyle,
      goal: prismaDto.goal,
      createdAt: prismaDto.createdAt,
      updatedAt: prismaDto.updatedAt,
    });
  }

  protected validatePrismaDto(prismaData: unknown): UserProfilePrismaDto {
    if (!isUserProfilePrismaDto(prismaData)) {
      throw new Error(`Invalid UserProfilePrismaDto`);
    }
    return prismaData;
  }

  protected isValidPrismaDto(data: unknown): data is UserProfilePrismaDto {
    return isUserProfilePrismaDto(data);
  }
}
