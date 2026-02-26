import { UserId } from "../../common/types/ids"; // ✅ Правильный импорт
import { Role } from "../../common/types/enums.types";
import { DomainError, EntityValidationError } from "../common/domain-error";
import { Result } from "../common/result";
import { logger } from "../../common/utils";

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly login: string,
    public readonly email: string | null,
    public readonly _password: string,
    public readonly role: Role,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: UserId;
    login: string;
    email?: string | null;
    password: string;
    role?: Role;
    isActive?: boolean;
  }): Result<User> {
    const errors: string[] = [];

    if (!props.login?.trim()) errors.push("Login required");
    if (props.login!.length < 3 || props.login!.length > 20) {
      errors.push("Login must be 3-20 characters");
    }

    if (props.password.length < 8) {
      errors.push("Password minimum 8 characters");
    }

    if (props.email && !props.email.includes("@")) {
      errors.push("Invalid email format");
    }

    if (errors.length > 0) {
      return Result.error(new EntityValidationError(errors));
    }

    return Result.ok(
      new User(
        props.id,
        props.login.trim(),
        props.email?.trim() ?? null,
        props.password,
        props.role ?? "USER",
        props.isActive ?? true,
        new Date(),
        new Date(),
      ),
    );
  }

  static reconstitute(props: {
    id: UserId;
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      props.id,
      props.login,
      props.email,
      props.password,
      props.role,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  hasRole(role: Role): boolean {
    return this.role === role;
  }
  isAdmin(): boolean {
    return this.role === "ADMIN";
  }
  async checkPassword(password: string): Promise<boolean> {
    try {
      const bcrypt = await import("bcryptjs");
      const result = await bcrypt.compare(password, this._password);
      logger.info(
        `🔑 bcrypt: "${password.slice(0, 3)}..." vs "${this._password.slice(0, 10)}..." = ${result}`,
      );
      return result;
    } catch (error) {
      logger.error("❌ bcrypt error", { error: String(error) });
      return false;
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    return this.checkPassword(password);
  }
}
