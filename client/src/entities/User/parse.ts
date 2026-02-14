import type { SafeUser } from "@/types";

export const parseUser = (apiUser: Record<string, unknown>): SafeUser => ({
  id: apiUser.id as string,
  login: apiUser.login as string,
  email: apiUser.email as string | null,
  role: apiUser.role as string,
  isActive: apiUser.isActive as boolean,
  createdAt: new Date(apiUser.createdAt as string),
  updatedAt: apiUser.updatedAt
    ? new Date(apiUser.updatedAt as string)
    : undefined,
});
