import { IUserRepository } from "..";
import { User } from "..";
import { UserId } from "../../common/types/ids";
import { Role } from "@prisma/client";

export class UserService {
  constructor(private userRepo: IUserRepository) {}

  async create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
  }): Promise<User> {
    const userData = await this.userRepo.create(data);
    return userData;
  }

  async getById(id: UserId): Promise<User> {
    return this.userRepo.findById(id);
  }

  async getActiveUsers(): Promise<User[]> {
    return [];
  }

  hasRole(user: User, role: Role): boolean {
    return user.hasRole(role);
  }

  isAdmin(user: User): boolean {
    return user.isAdmin();
  }
}
