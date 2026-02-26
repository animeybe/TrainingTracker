import { IProfileRepository } from "../repositories/i-profile.repository";
import { UserId } from "../../common/types/ids";
import { UserProfile } from "../entities";
import { Result } from "../common/result";
import {
  EntityNotFoundError,
  EntityAlreadyExistsError,
} from "../common/domain-error";
import { Goal, Lifestyle } from "../../common/types/enums.types";

export class ProfileService {
  constructor(private profileRepo: IProfileRepository) {}

  async createEmptyProfile(userId: UserId): Promise<Result<UserProfile>> {
    try {
      const existingProfile = await this.profileRepo.findByUserId(userId);
      if (existingProfile) {
        return Result.error(
          new EntityAlreadyExistsError("Profile", userId.value),
        );
      }

      const profileResult = UserProfile.createEmptyFor(userId);
      if (!Result.isOk(profileResult)) {
        return profileResult;
      }

      const profileData = {
        userId: userId.value,
        weight: null,
        height: null,
        age: null,
        lifestyle: null,
        goal: null,
      };

      const createdProfile = await this.profileRepo.create(profileData);
      return Result.ok(createdProfile);
    } catch (error: any) {
      return Result.error(
        new EntityAlreadyExistsError("Profile", userId.value),
      );
    }
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
  ): Promise<Result<UserProfile>> {
    try {
      const existingProfile = await this.profileRepo.findByUserId(userId);
      if (!existingProfile) {
        return Result.error(new EntityNotFoundError("Profile", userId.value));
      }

      const updatedProfile = await this.profileRepo.update(userId, data);
      return Result.ok(updatedProfile);
    } catch (error: any) {
      return Result.error(new EntityNotFoundError("Profile", userId.value));
    }
  }

  async getByUserId(userId: UserId): Promise<Result<UserProfile>> {
    try {
      const profile = await this.profileRepo.findByUserId(userId);
      if (!profile) {
        return Result.error(new EntityNotFoundError("Profile", userId.value));
      }
      return Result.ok(profile);
    } catch (error: any) {
      return Result.error(new EntityNotFoundError("Profile", userId.value));
    }
  }

  calculateBMI(profile: UserProfile): number | null {
    return profile.calculateBMI();
  }

  getBMICategory(profile: UserProfile): string {
    return profile.getBMICategory();
  }
}
