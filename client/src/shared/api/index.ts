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
 * Офлайн: для GET — берёт из Cache Storage (SW), для мутаций — сохраняет в IndexedDB очередь.
 *
 * Обработка ошибок:
 *   - 4xx/5xx → удаляем ошибочный ответ из кэша SW (чтобы не залипнуть на 404)
 *   - Сетевые ошибки → GET: пробуем кэш, мутации: в очередь
 */
export const apiRequest = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const FULL_URL = `${API_BASE}${url}`;
  const isGetRequest = !options.method || options.method === "GET";

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config: RequestInit = { ...options, headers };

  // Для GET-запросов — очистить кэш SW перед запросом
  if (isGetRequest) {
    caches
      .open("api-cache")
      .then((cache) => cache.delete(FULL_URL))
      .catch(() => {});
  }

  try {
    const response = await fetch(FULL_URL, config);

    // ── Успешный ответ ────────────────────────────────
    if (response.ok) {
      const data = await response.json();
      return (data.data || data) as T;
    }

    // ── HTTP-ошибка ───────────────────────────────────
    let errorData: Record<string, unknown> = {};
    try {
      errorData = (await response.json()) as Record<string, unknown>;
    } catch {
      errorData = {};
    }

    // Удаляем ошибочный ответ из кэша SW, чтобы не залипнуть на 404/500
    if (isGetRequest && (response.status === 404 || response.status >= 500)) {
      caches
        .open("api-cache")
        .then((cache) => cache.delete(FULL_URL))
        .catch(() => {});
    }

    const message = formatErrorMessage(url, response.status, errorData);
    throw new ApiError(message, response.status, errorData);
  } catch (error) {
    // ApiError — пробрасываем дальше
    if (error instanceof ApiError) throw error;

    // ── Сетевая ошибка (офлайн) ───────────────────────
    if (isGetRequest) {
      // Пробуем загрузить из Cache Storage
      const cached = await getFromCache(FULL_URL, url);
      if (cached) return cached as T;
      throw new ApiError("📴 Нет подключения к интернету", 0);
    }

    // Мутации — сохраняем в очередь
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

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

/**
 * Форматирует понятное сообщение об ошибке на русском.
 */
function formatErrorMessage(
  url: string,
  status: number,
  data: Record<string, unknown>,
): string {
  const serverMsg = (data.error as string) || (data.message as string) || "";
  const prefix = `[${status}]`;

  switch (status) {
    case 400:
      return `${prefix} ${serverMsg || "Неверный запрос"}`;
    case 401:
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("token");
      }
      return `${prefix} ${serverMsg || "Неверный логин или пароль"}`;
    case 403:
      return `${prefix} ${serverMsg || "Доступ запрещён"}`;
    case 404:
      return `${prefix} ${serverMsg || "Не найдено"}`;
    case 409:
      return `${prefix} ${serverMsg}`;
    case 429:
      return `${prefix} Слишком много запросов. Попробуйте позже`;
    case 500:
      return `${prefix} Внутренняя ошибка сервера. Попробуйте позже`;
    default:
      return `${prefix} ${serverMsg || "Неизвестная ошибка"}`;
  }
}

/**
 * Пытается загрузить ответ из Cache Storage (Service Worker).
 * Возвращает данные или null.
 */
async function getFromCache(
  fullUrl: string,
  shortUrl: string,
): Promise<unknown | null> {
  try {
    const cache = await caches.open("api-cache");
    const cachedResponse = await cache.match(fullUrl);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      console.log(`📦 Загружено из кэша: GET ${shortUrl}`);
      return data.data || data;
    }
  } catch {
    // Кэш недоступен
  }
  return null;
}

export { authApi } from "./authApi";
export { exerciseApi } from "./exerciseApi";
export { favoriteApi } from "./favoriteApi";
export { leastFavoriteApi } from "./leastFavoriteApi";
export { planApi } from "./planApi";
export { profileApi } from "./profileApi";
export { trainingExecutionApi } from "./trainingExecutionApi";
export { userStateApi } from "./userStateApi";
export { pushApi } from "./pushApi";
