import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaUserRepository, UserRepository } from "../../data/repositories/UserRepository";
import type { SafeUser, CreateUserDto, User } from "../../types";

const userRepo = new PrismaUserRepository();

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(
    login: string,
    password: string,
    email?: string,
  ): Promise<SafeUser> {
    // ✅ Проверяем по login
    const existing = await this.userRepo.findByLogin(login);
    if (existing) {
      throw new Error("User with this login already exists");
    }

    const userData: CreateUserDto = {
      login,
      password,
      email: email || null,
    };

    const fullUser = await this.userRepo.create(userData);

    const safeUser: SafeUser = {
      id: fullUser.id,
      login: fullUser.login,
      email: fullUser.email,
      role: fullUser.role,
      isActive: fullUser.isActive,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };

    return safeUser;
  }

  async login(login: string, password: string): Promise<SafeUser> {
    const user = await this.userRepo.findByLogin(login);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid login or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
