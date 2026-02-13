import type { SafeUser } from "./user.types";
import type { Request } from "express";

export interface LoginResponse {
  user: SafeUser;
  token: string;
}

export interface RegisterResponse {
  user: SafeUser;
  message: string;
}

export interface AuthRequest extends Request {
  user?: SafeUser;
  userId?: string;
}
