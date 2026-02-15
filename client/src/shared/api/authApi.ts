import type { SafeUser } from "@/types/auth.types";
import type { ExerciseListResponse } from "@/types/exercise.types";

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
    if (response.status === 401) {
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
  token: string;
};

type ProfileApiResponse = {
  userId: string;
  login: string;
  role: string;
  weight?: number;
  height?: number;
  age?: number;
  lifestyle?: string | null;
  goal?: string | null;
  bmi?: number;
  bmiCategory?: string;
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
        id: data.userId, // ✅ userId → id
        login: data.login,
        role: "USER",
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
        role: "USER",
      },
      token: data.token,
    };
  },

  getProfile: async (): Promise<SafeUser> => {
    const profile = await apiRequest<ProfileApiResponse>("/profile");

    return {
      id: profile.userId,
      login: profile.login,
      role: profile.role || "USER",
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      lifestyle: profile.lifestyle,
      goal: profile.goal,
      bmi: profile.bmi,
      bmiCategory: profile.bmiCategory,
    };
  },

  logout: () => localStorage.removeItem("token"),
};

// Остальные API (без изменений)
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
  getFavorites: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/favorites"),
  toggle: (exerciseId: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/favorites/${exerciseId}/toggle`, {
      method: "POST",
    }),
};

export const profileApi = {
  update: (data: {
    weight?: number;
    height?: number;
    age?: number;
  }): Promise<SafeUser> =>
    apiRequest<SafeUser>("/profile/update", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
