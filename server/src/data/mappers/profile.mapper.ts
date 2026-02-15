import { UserProfileDto, isUserProfileDto } from "../types/profile.dto";
import { UserId } from "../../common/types/ids";
import { UserProfile } from "../../domain/entities/user-profile";

export class ProfileMapper {
  toDomain(dto: UserProfileDto): UserProfile {
    this.validateDto(dto);
    return new UserProfile(
      UserId.create(dto.userId),
      dto.weight ?? 0,
      dto.height ?? 0,
      dto.age ?? 0,
      dto.lifestyle,
      dto.goal,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  private validateDto(dto: UserProfileDto): asserts dto is UserProfileDto {
    if (!isUserProfileDto(dto)) throw new Error("Invalid ProfileDto");
  }
}
