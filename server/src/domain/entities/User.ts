import type { SafeUser } from "../../types";

export class User {
  constructor(
    public readonly id: string,
    public readonly login: string, // login вместо name
    public readonly email: string | null, // string | null
    public readonly password: string,
    public readonly role: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get safe(): SafeUser {
    // Исключаем password + используем login
    const { password, ...safeData } = this;
    return safeData as SafeUser;
  }
}
