import { UserId } from "../../common/types/ids";
import { User } from "../entities";
import { Role } from "@prisma/client";

export interface IUserRepository {
  findById(id: UserId): Promise<User>;
  findByLogin(login: string): Promise<User | null>;
  create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
  }): Promise<User>;
}
