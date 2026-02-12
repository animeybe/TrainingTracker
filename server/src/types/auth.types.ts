import type { SafeUser } from "./user.types";

export interface LoginResponse {
  user: SafeUser;
  token: string;
}

export interface RegisterResponse {
  user: SafeUser;
  message: string;
}
