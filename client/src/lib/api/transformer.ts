import type { AuthResponse } from "@/types";
import { parseUser } from "@/entities/User";

export const transformAuthResponse = (data: unknown): AuthResponse => {
  const apiData = data as Record<string, unknown>;
  return {
    user: parseUser(apiData.user as Record<string, unknown>),
    token: apiData.token as string,
  };
};
