import { PrismaClient } from "@prisma/client";
import { User, SafeUser, CreateUserDto } from "../../types";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface UserRepository {
    create(data: CreateUserDto): Promise<User>;
    findByLogin(login: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
}

export class PrismaUserRepository implements UserRepository {
  async create(data: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // ✅ НОВЫЕ ПОЛЯ: login вместо name, email опциональный
    const user = await prisma.user.create({
      data: {
        login: data.login, // ✅ login (обязательный)
        email: data.email || null, // ✅ email (опциональный)
        password: hashedPassword,
        role: data.role || "USER",
      },
    });

    // ✅ Маппинг с учетом новой схемы
    return {
      id: user.id,
      login: user.login, // ✅ login вместо name
      email: user.email, // ✅ string | null
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByLogin(login: string): Promise<User | null> {
    // ✅ По login (уникальный)
    const user = await prisma.user.findUnique({
      where: { login },
    });

    if (!user) return null;

    return {
      id: user.id,
      login: user.login,
      email: user.email, // ✅ string | null
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
