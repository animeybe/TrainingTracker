// domain/repositories/i-profile.repository.ts
import { UserProfileEntity } from "../entities/user-profile.entity";

export interface IUserProfileRepository {
  create(data: UserProfileEntity): Promise<UserProfileEntity>;
  update(
    userId: string,
    data: Partial<UserProfileEntity>,
  ): Promise<UserProfileEntity | null>;
  findById(id: string): Promise<UserProfileEntity | null>;
  findByUserId(userId: string): Promise<UserProfileEntity | null>;
  findAll(): Promise<UserProfileEntity[]>;
  delete(id: string): Promise<boolean>;
  exists(userId: string): Promise<boolean>;
}
