// api/authApi.ts
import type { SafeUser } from "@/types/auth.types";
import { apiRequest } from "./index";

type AuthApiResponse = {
  userId: string;
  login: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  token: string;
};

export const authApi = {
  register: async (
    login: string,
    password: string,
    email?: string,
  ): Promise<{ user: SafeUser; token: string }> => {
    const data = await apiRequest<AuthApiResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        login: login.trim(),
        password,
        email: email?.trim() || undefined,
      }),
    });

    return {
      user: {
        id: data.userId,
        login: data.login,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      },
      token: data.token,
    };
  },

  login: async (
    login: string,
    password: string,
  ): Promise<{ user: SafeUser; token: string }> => {
    const data = await apiRequest<AuthApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: login.trim(), password }),
    });

    localStorage.setItem("token", data.token);

    return {
      user: {
        id: data.userId,
        login: data.login,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      },
      token: data.token,
    };
  },

  getMe: async (): Promise<SafeUser> => {
    const data = await apiRequest<{
      userId: string;
      login: string;
      email: string | null;
      role: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>("/auth/me");

    return {
      id: data.userId,
      login: data.login,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  },

  logout: () => localStorage.removeItem("token"),

  updateAccount: async (data: {
    login?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<void> => {
    await apiRequest("/auth/account", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
