// src/data/repositories/prisma-user.repository.ts
import { prisma } from "../../infrastructure/prisma/client";
import { UserPrismaDto, isUserPrismaDto } from "../dto/user.prisma-dto";
import { UserMapper } from "../mappers/user.mapper";
import { UserId } from "../../common/types/ids";
import {
  IUserRepository,
  UpdateUserDto,
} from "../../domain/repositories/i-user.repository";
import { Role } from "../../common/types/enums.types";
import { logger } from "../../common/utils";
import { User } from "../../domain";

export class PrismaUserRepository implements IUserRepository {
  private readonly mapper = new UserMapper();

  async update(id: UserId, data: UpdateUserDto): Promise<User> {
    logger.info("🔧 PrismaUserRepository.update START", {
      id: id.value,
      data,
    });

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.login) {
      const trimmedLogin = data.login.trim();
      logger.info("📝 Login trimmed", {
        original: data.login,
        trimmed: trimmedLogin,
      });
      updateData.login = trimmedLogin;
    }

    if (data.email !== undefined) {
      const trimmedEmail = data.email ? data.email.trim() : null;
      logger.info("📧 Email processed", {
        original: data.email,
        trimmed: trimmedEmail,
      });
      updateData.email = trimmedEmail;
    }

    if (data.password) {
      logger.info("🔐 Password will be updated (already hashed)");
      updateData.password = data.password; // Уже хэшированный из Service!
    }

    logger.info("🚀 Calling prisma.user.update", { updateData });

    try {
      const prismaUser = await prisma.user.update({
        where: { id: id.value },
        data: updateData,
      });

      logger.info("✅ PrismaUserRepository.update SUCCESS", {
        id: prismaUser.id,
        login: prismaUser.login,
      });

      // ✅ Используем статический метод entity
      return User.reconstitute({
        id: UserId.create(prismaUser.id),
        login: prismaUser.login,
        email: prismaUser.email,
        password: prismaUser.password, // хэшированный
        role: prismaUser.role as Role,
        isActive: prismaUser.isActive,
        createdAt: new Date(prismaUser.createdAt),
        updatedAt: new Date(prismaUser.updatedAt),
      });
    } catch (error: unknown) {
      logger.error("💥 prisma.user.update FAILED", {
        id: id.value,
        updateData,
        error: String(error),
      });
      throw error;
    }
  }

  async findById(id: UserId): Promise<User> {
    logger.info("🔍 PrismaUserRepository.findById", { id: id.value });

    const idValue = id.value ?? id.toString();
    if (!idValue) throw new Error(`Invalid UserId: ${id}`);

    const prismaData = await prisma.user.findUnique({
      where: { id: idValue },
    });

    if (!prismaData || !isUserPrismaDto(prismaData)) {
      logger.warn(`User not found: ${id.value}`);
      throw new Error(`User ${id.value} not found`);
    }

    logger.info("✅ User found by ID", { id: id.value });
    return this.mapper.toDomain(prismaData);
  }

  async findByLogin(login: string): Promise<User | null> {
    logger.info("🔍 PrismaUserRepository.findByLogin", { login });

    const prismaData = await prisma.user.findUnique({
      where: { login: login.trim() },
    });

    if (!prismaData || !isUserPrismaDto(prismaData)) {
      logger.info("ℹ️ User not found by login", { login });
      return null;
    }

    logger.info("✅ User found by login", { login });
    return this.mapper.toDomain(prismaData);
  }

  async create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<User> {
    logger.info("🆕 PrismaUserRepository.create", {
      login: data.login,
      email: data.email || "NULL",
    });

    const prismaData = (await prisma.user.create({
      data: {
        id: undefined, // auto-generate
        ...data,
      },
    })) as UserPrismaDto;

    logger.info("✅ User created", { id: prismaData.id });
    return this.mapper.toDomain(prismaData);
  }
}
