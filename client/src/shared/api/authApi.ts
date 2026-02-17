import type { SafeUser } from "@/types/auth.types";
import type { ExerciseListResponse } from "@/types/exercise.types";
import type { FavoriteListResponse } from "@/types/favorite.type";
import type { ProfileData } from "@/types/profile.types";

const API_BASE = "http://localhost:3001/api";

type ApiResponse<T> = Promise<T>;

const apiRequest = async <T>(
  url: string,
  options: RequestInit = {},
): ApiResponse<T> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = { ...options, headers };
  const response = await fetch(`${API_BASE}${url}`, config);

  if (!response.ok) {
    if (
      response.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      throw new Error("Токен недействителен");
    }
    try {
      const errorData = await response.json();
      throw new Error(
        (errorData as { error?: string }).error || `HTTP ${response.status}`,
      );
    } catch {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  const data = await response.json();
  return data as T;
};

type AuthApiResponse = {
  userId: string;
  login: string;
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

    localStorage.setItem("token", data.token);

    return {
      user: {
        id: data.userId,
        login: data.login,
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
      role: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>("/auth/me");

    return {
      id: data.userId,
      login: data.login,
      role: data.role,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  },

  logout: () => localStorage.removeItem("token"),
};

export const exerciseApi = {
  getAll: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/exercises"),
  getByMuscle: (muscle: string): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>(`/exercises/muscle/${muscle}`),
  search: (query: string): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>(
      `/exercises/search?query=${encodeURIComponent(query)}`,
    ),
};

export const favoriteApi = {
  getFavorites: (): Promise<FavoriteListResponse> =>
    apiRequest<FavoriteListResponse>("/favorites"),
  toggle: (
    exerciseId: string,
  ): Promise<{ success: boolean; message?: string }> =>
    apiRequest<{ success: boolean; message?: string }>(
      `/favorites/${exerciseId}/toggle`,
      {
        method: "POST",
      },
    ),
};

export const profileApi = {
  getProfile: async (): Promise<ProfileData> => {
    return apiRequest("/profile");
  },

  update: (data: {
    weight?: number;
    height?: number;
    age?: number;
    lifestyle?: string;
    goal?: string;
  }): Promise<void> => {
    return apiRequest("/profile/update", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
