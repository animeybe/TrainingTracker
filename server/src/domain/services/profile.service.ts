// domain/services/profile.service.ts
import { UserProfileEntity } from "../entities/user-profile.entity";
import { IProfileRepository } from "../repositories/i-profile.repository";

export class ProfileService {
  private repo: IProfileRepository;

  constructor(repo: IProfileRepository) {
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
