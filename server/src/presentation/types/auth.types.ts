import { Request } from "express";
import { ApiResponse } from "./common.types";

export type Role = "USER" | "ADMIN";

export interface LoginRequestDto {
  login: string;
  password: string;
}

export interface RegisterRequestDto {
  login: string;
  email: string | null;
  password: string;
}

export interface AuthResponseDto {
  userId: string;
  login: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export type AuthResponse = ApiResponse<AuthResponseDto>;
export type MeResponse = ApiResponse<AuthResponseDto>;
