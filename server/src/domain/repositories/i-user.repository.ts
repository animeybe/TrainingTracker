// domain/repositories/i-user.repository.ts
import {
  UserEntity,
  CreateUserEntity,
  UpdateUserEntity,
} from "../entities/user.entity";

export interface IUserRepository {
  create(data: CreateUserEntity): Promise<UserEntity>;
  update(id: string, data: UpdateUserEntity): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findByLogin(login: string): Promise<UserEntity | null>;
  findByEmail(email: string | null): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
