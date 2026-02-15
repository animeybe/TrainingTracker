import { UserId } from "../../common/types/ids";
import { UserProfile } from "../entities";
import { Lifestyle, Goal } from "@prisma/client";

export interface IProfileRepository {
  findByUserId(userId: UserId): Promise<UserProfile>;
  create(data: {
    userId: string;
    weight?: number | null;
    height?: number | null;
    age?: number | null;
    lifestyle?: Lifestyle | null;
    goal?: Goal | null;
  }): Promise<UserProfile>;
  update(
    userId: UserId,
    data: Partial<{
      weight: number | null;
      height: number | null;
      age: number | null;
      lifestyle: Lifestyle | null;
      goal: Goal | null;
    }>,
  ): Promise<UserProfile>;
  delete(userId: UserId): Promise<void>;
}
