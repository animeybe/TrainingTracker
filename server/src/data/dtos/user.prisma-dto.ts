// data/dtos/user.prisma-dto.ts
import type { Role } from "../../common/types/enums.types";

// 1. DTO для READ (API / UI)
export type UserDto = {
  id: string;
  login: string;
  email: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 2. DTO для создания
export type CreateUserDto = {
  login: string;
  email: string | null;
  passwordHash: string;
  role?: Role;
  isActive?: boolean;
};

// 3. DTO для апдейта
export type UpdateUserDto = Partial<CreateUserDto>;
