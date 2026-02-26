const API_BASE = "http://localhost:3001/api";

export const apiRequest = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
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

// ✅ EXPORTS API
export { authApi } from "./authApi";
export { exerciseApi } from "./exerciseApi";
export { favoriteApi } from "./favoriteApi";
export { planApi } from "./planApi";
export { profileApi } from "./profileApi";
