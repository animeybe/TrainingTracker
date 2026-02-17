import type { SafeUser } from "@/types/auth.types";

export const parseUser = (apiUser: Record<string, unknown>): SafeUser => ({
  id: (apiUser.id as string) || (apiUser.userId as string),
  login: apiUser.login as string,
  role: (apiUser.role as string) || "USER",
  isActive: apiUser.isActive as boolean,
  createdAt: apiUser.createdAt as Date,
  updatedAt: apiUser.updatedAt as Date
});
