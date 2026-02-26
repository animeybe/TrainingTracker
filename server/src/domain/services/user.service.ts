import {
  IUserRepository,
  UpdateUserDto,
} from "../repositories/i-user.repository";
import { User } from "../entities/user.entity";
import { Role } from "../../common/types/enums.types";
import { Result } from "../common/result";
import {
  EntityNotFoundError,
  EntityValidationError,
  DomainError,
} from "../common/domain-error";
import { UserId } from "../../common/types/ids";
import { logger } from "../../common/utils";

interface UpdateAccountData {
  login?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  password?: string;
}

export class UserService {
  constructor(private userRepo: IUserRepository) {}

  async updateAccount(
    userId: UserId,
    data: UpdateAccountData,
  ): Promise<Result<void>> {
    try {
      logger.info("🔍 UserService START", {
        userId: userId.value,
        loginChange: !!data.login,
        emailChange: !!data.email,
        hasCurrentPassword: !!data.currentPassword,
      });

      // 1. Получить пользователя
      const userResult = await this.getById(userId);
      if (!Result.isOk(userResult)) {
        logger.error("❌ User not found", { userId: userId.value });
        return Result.error(userResult.error);
      }
      const user = userResult.value;
      logger.info("✅ User found", {
        login: user.login,
        email: user.email,
        userId: user.id.value,
      });

      // 2. Бизнес-валидация пароля
      if (data.newPassword && !data.currentPassword) {
        logger.warn("❌ Missing currentPassword for password change");
        return Result.error(
          new EntityValidationError([
            "Требуется текущий пароль для смены пароля",
          ]),
        );
      }

      // ✅ НОВЫЕ ПРОВЕРКИ: логин и email БЕЗ пароля
      if (data.login && data.login === user.login) {
        logger.info("ℹ️ Login unchanged, skipping");
      } else if (data.login) {
        logger.info("🔍 Login change detected - checking uniqueness");
        // Проверка уникальности уже есть ниже ✅
      }

      if (data.currentPassword) {
        logger.info("🔑 Password check START", {
          plain: data.currentPassword.slice(0, 3) + "***",
          userLogin: user.login,
        });

        const isValid = await user.checkPassword(data.currentPassword);
        logger.info("🔑 Password result", { isValid });

        if (!isValid) {
          logger.warn("❌ Wrong password");
          return Result.error(
            new EntityValidationError(["Неверный текущий пароль"]),
          );
        }
        logger.info("✅ Password OK");
      }

      // 3. Подготовка данных для репозитория
      logger.info("📦 Preparing repoData", { rawData: data });
      const repoData: UpdateUserDto = {};

      // LOGIN
      if (data.login && data.login !== user.login) {
        logger.info("🔍 Checking login uniqueness", { newLogin: data.login });
        const existingByLogin = await this.userRepo.findByLogin(data.login);
        logger.info("🔍 Login check result", {
          existing: !!existingByLogin,
          existingId: existingByLogin?.id.value,
        });

        if (existingByLogin && existingByLogin.id.value !== userId.value) {
          logger.warn("❌ Login already exists");
          return Result.error(new EntityValidationError(["Логин уже занят"]));
        }
        repoData.login = data.login;
        logger.info("✅ Login added to repoData");
      }

      // EMAIL
      if (data.email !== undefined && data.email !== user.email) {
        logger.info("📧 Processing email", {
          newEmail: data.email || "NULL",
          oldEmail: user.email || "NULL",
        });
        repoData.email = data.email || null; // '' → null
        logger.info("✅ Email added to repoData");
      }

      // PASSWORD
      if (data.newPassword) {
        logger.info("🔐 New password set");
        repoData.password = data.newPassword;
      }

      logger.info("📦 Final repoData", {
        repoData,
        hasChanges: Object.keys(repoData).length > 0,
      });

      // 4. Обновление в БД
      if (Object.keys(repoData).length > 0) {
        logger.info("🚀 Calling repo.update()", { userId: userId.value });
        await this.userRepo.update(userId, repoData);
        logger.info("✅ repo.update() SUCCESS");
      } else {
        logger.info("ℹ️ No changes detected → skipping update");
      }

      logger.info("🎉 Returning Result.ok()");
      return Result.ok(undefined);
    } catch (error: unknown) {
      logger.error("💥 UserService CRASH", {
        error: String(error),
        errorName: (error as any)?.name,
        errorMessage: (error as any)?.message,
      });
      return Result.error(
        error instanceof DomainError
          ? error
          : new EntityValidationError(["Ошибка обновления аккаунта"]),
      );
    }
  }

  async getById(id: UserId): Promise<Result<User>> {
    try {
      const user = await this.userRepo.findById(id);
      return Result.ok(user);
    } catch (error) {
      return Result.error(new EntityNotFoundError("User", id.value));
    }
  }

  async getByLogin(login: string): Promise<Result<User | null>> {
    try {
      const user = await this.userRepo.findByLogin(login);
      return Result.ok(user);
    } catch (error) {
      return Result.error(new EntityNotFoundError("User", login));
    }
  }

  async create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<User>> {
    try {
      const userResult = User.create({
        id: UserId.create(""), // будет перезаписан репозиторием
        login: data.login,
        email: data.email,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
      });

      if (!Result.isOk(userResult)) {
        return Result.error(userResult.error);
      }

      const user = await this.userRepo.create({
        ...data,
        login: userResult.value.login,
        email: userResult.value.email,
      });

      return Result.ok(user);
    } catch (error) {
      return Result.error(new EntityNotFoundError("User", "creation failed"));
    }
  }

  hasRole(user: User, role: Role): boolean {
    return user.hasRole(role);
  }

  isAdmin(user: User): boolean {
    return user.isAdmin();
  }
}
