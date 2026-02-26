import { UserId } from "../../common/types/ids";
import { User } from "../entities/user.entity";
import { Role } from "../../common/types/enums.types";

export interface UpdateUserDto {
  login?: string;
  email?: string | null;
  password?: string;
}

export interface IUserRepository {
  findById(id: UserId): Promise<User>;
  findByLogin(login: string): Promise<User | null>;
  update(id: UserId, data: UpdateUserDto): Promise<User>;
  create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<User>;
}
