import { UserPrismaDto, isUserPrismaDto } from "../dto/user.prisma-dto";
import { User } from "../../domain/entities/user.entity";
import { UserId } from "../../common/types/ids";
import { BaseMapper } from "../common/base.mapper";

export class UserMapper extends BaseMapper<UserPrismaDto, User> {
  protected doMap(prismaDto: UserPrismaDto): User {
    // ✅ reconstitute из БД
    return User.reconstitute({
      id: UserId.create(prismaDto.id),
      login: prismaDto.login,
      email: prismaDto.email,
      password: prismaDto.password,
      role: prismaDto.role,
      isActive: prismaDto.isActive,
      createdAt: prismaDto.createdAt,
      updatedAt: prismaDto.updatedAt,
    });
  }

  protected validatePrismaDto(prismaData: unknown): UserPrismaDto {
    if (!isUserPrismaDto(prismaData)) {
      throw new Error(`Invalid UserPrismaDto: ${JSON.stringify(prismaData)}`);
    }
    return prismaData;
  }

  protected isValidPrismaDto(data: unknown): data is UserPrismaDto {
    return isUserPrismaDto(data);
  }
}
