export interface User {
  id: string;
  login: string;
  email: string | null;
  password: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SafeUser {
  id: string;
  login: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateUserDto {
  login: string;
  email?: string | null;
  password: string;
  role?: "USER" | "ADMIN";
}
