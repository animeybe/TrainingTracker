import { IProfileRepository } from "..";
import { UserProfile } from "..";
import { UserId } from "../../common/types/ids";

export class ProfileService {
  constructor(private profileRepo: IProfileRepository) {}

  async getOrCreate(userId: UserId): Promise<UserProfile> {
    try {
      return await this.profileRepo.findByUserId(userId);
    } catch {
      const profile = await this.profileRepo.create({
        userId: userId.value,
        weight: 70,
        height: 175,
        age: 25,
        lifestyle: "AVERAGE",
        goal: "MAINTAIN_WEIGHT",
      });
      return profile;
    }
  }

  calculateBMI(profile: UserProfile): number {
    return profile.calculateBMI();
  }

  isReadyForHardTraining(profile: UserProfile): boolean {
    return profile.isReadyForHardTraining();
  }
}
