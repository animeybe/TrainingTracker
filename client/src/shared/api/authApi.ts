import axios from "axios";
import type { User } from "../store";

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthApi {
  private api = axios.create({
    baseURL: "http://localhost:3001/api",
  });

  constructor() {
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  register = async (username: string, password: string) => {
    const response = await this.api.post("/auth/register", {
      username,
      password,
    });
    return response.data;
  };

  login = async (username: string, password: string) => {
    const response = await this.api.post("/auth/login", { username, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  };

  getProfile = async () => {
    const response = await this.api.get("/protected/profile");
    return response.data;
  };
}

export const authApi = new AuthApi();
