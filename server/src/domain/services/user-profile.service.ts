// domain/services/profile.service.ts
import { UserProfileEntity } from "../entities/user-profile.entity";
import { IUserProfileRepository } from "../repositories/i-user-profile.repository";

export class UserProfileService {
  private repo: IUserProfileRepository;

  constructor(repo: IUserProfileRepository) {
    this.repo = repo;
  }

  async createProfile(data: UserProfileEntity): Promise<UserProfileEntity> {
    return await this.repo.create(data);
  }

  async updateProfile(
    userId: string,
    data: Partial<UserProfileEntity>,
  ): Promise<UserProfileEntity | null> {
    return await this.repo.update(userId, data);
  }

  async findById(id: string): Promise<UserProfileEntity | null> {
    return await this.repo.findById(id);
  }

  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    return await this.repo.findByUserId(userId);
  }

  async findAll(): Promise<UserProfileEntity[]> {
    return await this.repo.findAll();
  }

  async deleteProfile(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  async exists(userId: string): Promise<boolean> {
    return await this.repo.exists(userId);
  }
}
