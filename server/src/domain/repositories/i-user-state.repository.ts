// domain/repositories/i-user-state.repository.ts

import {
  UserStateEntity,
  CreateUserStateEntity,
  UpdateUserStateEntity,
} from "../entities/user-state.entity";

export interface IUserStateRepository {
  create(data: CreateUserStateEntity): Promise<UserStateEntity>;
  update(
    id: string,
    data: UpdateUserStateEntity,
  ): Promise<UserStateEntity | null>;
  updateCurrentWeek(
    userId: string,
    newWeek: number,
  ): Promise<UserStateEntity | null>;
  findById(id: string): Promise<UserStateEntity | null>;
  findByUserId(userId: string): Promise<UserStateEntity | null>;
  findAll(): Promise<UserStateEntity[]>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
