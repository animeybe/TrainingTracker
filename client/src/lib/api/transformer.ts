// lib/api/transformer.ts
import type { ProfileResponse } from "@/types";
import type { AuthResponse } from "@/types";
import { parseUser } from "@/entities/User";

export const transformAuthResponse = (data: unknown): AuthResponse => {
  const apiData = data as Record<string, unknown>;
  if (!apiData.user) throw new Error("AuthResponse missing user");

  return {
    user: parseUser(apiData.user as Record<string, unknown>),
    message: apiData.message as string,
    token: apiData.token as string,
  };
};

export const transformProfileResponse = (data: unknown): ProfileResponse => {
  const apiData = data as Record<string, unknown>;
  if (!apiData.user) throw new Error("ProfileResponse missing user");

  return {
    user: parseUser(apiData.user as Record<string, unknown>),
  };
};
