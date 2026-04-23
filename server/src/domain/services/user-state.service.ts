// domain/services/user-state.service.ts

import {
  UserStateEntity,
  CreateUserStateEntity,
  UpdateUserStateEntity,
} from "../entities/user-state.entity";
import { IUserStateRepository } from "../repositories/i-user-state.repository";

export class UserStateService {
  private repo: IUserStateRepository;

  constructor(repo: IUserStateRepository) {
    this.repo = repo;
  }

  async create(data: CreateUserStateEntity): Promise<UserStateEntity> {
    return this.repo.create(data);
  }

  async update(
    id: string,
    data: UpdateUserStateEntity,
  ): Promise<UserStateEntity | null> {
    return this.repo.update(id, data);
  }

  async updateCurrentWeek(
    userId: string,
    newWeek: number,
  ): Promise<UserStateEntity | null> {
    return this.repo.updateCurrentWeek(userId, newWeek);
  }

  async findByUserId(userId: string): Promise<UserStateEntity | null> {
    return this.repo.findByUserId(userId);
  }

  async findById(id: string): Promise<UserStateEntity | null> {
    return this.repo.findById(id);
  }

  async findAll(): Promise<UserStateEntity[]> {
    return this.repo.findAll();
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repo.exists(id);
  }
}
