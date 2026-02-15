import { UserId } from "../../common/types/ids";
import { Role } from "@prisma/client";

export class User {
  constructor(
    public readonly id: UserId,
    public readonly login: string,
    public readonly email: string | null,
    private readonly _password: string,
    public readonly role: Role,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  hasRole(role: Role): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === "ADMIN";
  }

  matchesPassword(password: string): boolean {
    return this._password === password; // В проде bcrypt!
  }
}
