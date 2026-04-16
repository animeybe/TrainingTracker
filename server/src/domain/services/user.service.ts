// domain/services/user.service.ts
import * as bcrypt from "bcrypt";
import {
  UserEntity,
  CreateUserEntity,
  UpdateUserEntity,
} from "../entities/user.entity";
import { IUserRepository } from "../repositories/i-user.repository";

export class UserService {
  private repo: IUserRepository;

  constructor(repo: IUserRepository) {
    this.repo = repo;
  }

  async createUser(data: CreateUserEntity): Promise<UserEntity> {
    return await this.repo.create(data);
  }

  async updateUser(
    id: string,
    data: UpdateUserEntity,
  ): Promise<UserEntity | null> {
    return await this.repo.update(id, data);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return await this.repo.findById(id);
  }

  async findByLogin(login: string): Promise<UserEntity | null> {
    return await this.repo.findByLogin(login);
  }

  async findByEmail(email: string | null): Promise<UserEntity | null> {
    return await this.repo.findByEmail(email);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.repo.findAll();
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.repo.exists(id);
  }

  async login(login: string, password: string): Promise<UserEntity | null> {
    const user = await this.repo.findByLogin(login);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
  }
}
