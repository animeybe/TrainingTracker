// domain/entities/user.entity.ts
import { Role } from "../../common/types/enums.types";

export type UserEntity = {
  id: string;
  login: string;
  email: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserEntity = {
  login: string;
  email: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
};

export type UpdateUserEntity = Partial<CreateUserEntity>;
