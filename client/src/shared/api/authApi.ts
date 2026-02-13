import type { AuthResponse, ProfileResponse } from "@/types";

// Полный authApi с getProfile!
export const authApi = {
  // Регистрация (3 аргумента)
  register: async (
    login: string,
    password: string,
    email?: string,
  ): Promise<AuthResponse> => {
    const body = { login, password, email: email || undefined };
    const response = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  // Логин (2 аргумента)
  login: async (login: string, password: string): Promise<AuthResponse> => {
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  // getProfile - восстановление профиля по токену!
  getProfile: async (): Promise<ProfileResponse> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const response = await fetch("http://localhost:3001/api/auth/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      throw new Error("Invalid token");
    }

    return response.json();
  },

  // Логаут
  logout: async () => {
    localStorage.removeItem("token");
  },
};
