// api/index.ts
import { addToQueue } from "@/lib/offline/offlineQueue";

export const API_BASE = "https://api.trainingtracker.ru/api";

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(
    message: string,
    status: number,
    data?: Record<string, unknown> | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data || null;
  }
}

/**
 * Единая точка входа для всех API-запросов.
 *
 * Онлайн: делает fetch, кэширует GET-ответы через Service Worker.
 * Офлайн: для GET — берёт из Cache Storage (SW), для мутаций — сохраняет в очередь.
 */
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

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    // ── Онлайн: пробуем сеть ────────────────────────────
    const response = await fetch(FULL_URL, config);

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = (await response.json()) as Record<string, unknown>;
      } catch {
        errorData = {};
      }

      let message =
        (errorData.error as string) ||
        (errorData.message as string) ||
        `Ошибка ${response.status}`;

      // Понятные сообщения на русском
      switch (response.status) {
        case 400:
          message = `Ошибка 400: ${message || "Неверный запрос"}`;
          break;
        case 401:
          if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
            localStorage.removeItem("token");
          }
          message = `Ошибка 401: ${message || "Неверный логин или пароль"}`;
          break;
        case 403:
          message = `Ошибка 403: ${message || "Доступ запрещён"}`;
          break;
        case 404:
          message = `Ошибка 404: ${message || "Не найдено"}`;
          break;
        case 409:
          message = `Ошибка 409: ${message}`;
          break;
        case 429:
          message = "Ошибка 429: Слишком много запросов. Попробуйте позже";
          break;
        case 500:
          message = "Ошибка 500: Внутренняя ошибка сервера. Попробуйте позже";
          break;
        default:
          message = `Ошибка ${response.status}: ${message}`;
      }

      throw new ApiError(message, response.status, errorData);
    }

    const data = await response.json();
    return (data.data || data) as T;
  } catch (error) {
    // Пробрасываем ApiError дальше
    if (error instanceof ApiError) {
      throw error;
    }

    // ── Офлайн или сетевая ошибка ────────────────────────
    const isGetRequest = !options.method || options.method === "GET";

    if (isGetRequest) {
      // GET: пробуем загрузить из Cache Storage (через Service Worker)
      try {
        const cache = await caches.open("api-cache");
        const cachedResponse = await cache.match(FULL_URL);
        if (cachedResponse) {
          const data = await cachedResponse.json();
          console.log(`📦 Загружено из кэша: GET ${url}`);
          return (data.data || data) as T;
        }
      } catch {
        // Кэш недоступен — продолжаем
      }
      throw new ApiError("📴 Нет подключения к интернету", 0);
    }

    // Мутирующие запросы (POST/PUT/DELETE): сохраняем в офлайн-очередь
    addToQueue({
      url: FULL_URL,
      method: options.method || "GET",
      body: options.body ? JSON.parse(options.body as string) : null,
    });
    throw new ApiError(
      "📴 Нет подключения к интернету. Запрос будет отправлен при восстановлении сети",
      0,
    );
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
