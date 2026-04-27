// api/index.ts
import { addToQueue } from "@/lib/offline/offlineQueue";

export const API_BASE = "http://localhost:5173/api";

export const apiRequest = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const FULL_URL = `${API_BASE}${url}`;

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = { ...options, headers };

  try {
    const response = await fetch(FULL_URL, config);

    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json();
        throw new Error(
          (errorData as { error?: string }).error || `HTTP ${response.status}`,
        );
      }
      if (
        response.status === 401 &&
        !url.includes("/auth/login") &&
        !url.includes("/auth/register")
      ) {
        localStorage.removeItem("token");
        throw new Error("Токен недействителен");
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.data || data) as T;
  } catch (error) {
    // Если сеть недоступна и это мутирующий запрос — сохраняем в очередь
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      if (options.method && options.method !== "GET") {
        addToQueue({
          url: FULL_URL,
          method: options.method,
          body: options.body ? JSON.parse(options.body as string) : null,
        });
        throw new Error(
          "📴 Запрос сохранён в очередь — отправится при подключении к сети",
        );
      }
    }
    throw error;
  }
};

export { authApi } from "./authApi";
export { exerciseApi } from "./exerciseApi";
export { favoriteApi } from "./favoriteApi";
export { leastFavoriteApi } from "./leastFavoriteApi";
export { planApi } from "./planApi";
export { profileApi } from "./profileApi";
export { trainingExecutionApi } from "./trainingExecutionApi";
export { userStateApi } from "./userStateApi";
export { pushApi } from "./pushApi";
