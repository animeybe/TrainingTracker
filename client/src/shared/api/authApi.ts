import type { AuthResponse, ProfileResponse } from "@/types";
import { transformAuthResponse, transformProfileResponse } from "@/lib/api";

export const authApi = {
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

    const data = await response.json();
    return transformAuthResponse(data);
  },

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

    const data = await response.json();
    return transformAuthResponse(data);
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const response = await fetch("http://localhost:3001/api/auth/profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      throw new Error("Invalid token");
    }

    const data = await response.json();
    return transformProfileResponse(data);
  },

  logout: async () => {
    localStorage.removeItem("token");
  },
};
