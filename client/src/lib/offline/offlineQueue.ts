// shared/lib/offlineQueue.ts

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: Record<string, unknown> | null;
  timestamp: number;
}

const DB_NAME = "TrainingTrackerOffline";
const DB_VERSION = 2;
const STORE_NAME = "offline-queue";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToQueue(
  request: Omit<QueuedRequest, "id" | "timestamp">,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const item: QueuedRequest = {
    ...request,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  };
  store.add(item);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      console.log(`📦 Добавлено в очередь: ${request.method} ${request.url}`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

async function sendRequest(
  item: { url: string; method: string; body?: Record<string, unknown> | null },
  token: string,
): Promise<Response> {
  return fetch(item.url, {
    method: item.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: item.body ? JSON.stringify(item.body) : undefined,
  });
}

/**
 * Клонировать тело запроса, сохраняя тип (массив или объект).
 */
function cloneBody(
  body: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return [...body] as unknown as Record<string, unknown>;
  }
  return { ...body };
}

/**
 * Подменить local-... id в URL и теле запроса на реальный id.
 */
function applyIdMapping(
  url: string,
  body: Record<string, unknown> | null,
  idMapping: Record<string, string>,
): { url: string; body: Record<string, unknown> | null } {
  let updatedUrl = url;
  let updatedBody = body;

  for (const [localId, realId] of Object.entries(idMapping)) {
    updatedUrl = updatedUrl.replace(localId, realId);
    if (updatedBody) {
      const bodyStr = JSON.stringify(updatedBody);
      const newBodyStr = bodyStr.replace(new RegExp(localId, "g"), realId);
      if (newBodyStr !== bodyStr) {
        updatedBody = JSON.parse(newBodyStr);
      }
    }
  }

  return { url: updatedUrl, body: updatedBody };
}

/**
 * Дедубликация: для toggle-запросов оставляем только последний.
 */
function deduplicateQueue(queue: QueuedRequest[]): QueuedRequest[] {
  const seen = new Map<string, number>();
  // Первый проход: запоминаем последний индекс для каждого URL
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (
      item.url.includes("/favorites") ||
      item.url.includes("/least-favorites")
    ) {
      seen.set(item.url, i);
    }
  }
  // Второй проход: оставляем только последние или не-toggle запросы
  return queue.filter((item, index) => {
    if (
      item.url.includes("/favorites") ||
      item.url.includes("/least-favorites")
    ) {
      return seen.get(item.url) === index;
    }
    return true;
  });
}

/**
 * Обработать очередь: отправить все накопленные запросы на сервер.
 *
 * Умная обработка:
 *   - Дедубликация toggle-запросов (избранное/нелюбимые)
 *   - Запросы обрабатываются последовательно (POST /days → получаем id → PUT /finish)
 *   - local-... id в URL и body подменяются на реальный id из ответа POST /days
 *   - Ошибочные запросы (404, 500) удаляются из очереди
 */
export async function processQueue(): Promise<{
  success: number;
  failed: number;
}> {
  let queue = await getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  // Дедубликация toggle-запросов
  queue = deduplicateQueue(queue);

  console.log(`🔄 Обработка очереди: ${queue.length} запросов`);

  const token = localStorage.getItem("token") || "";
  let success = 0;
  let failed = 0;

  const idMapping: Record<string, string> = {};

  for (const item of queue) {
    const body = cloneBody(item.body || null);
    const { url, body: updatedBody } = applyIdMapping(
      item.url,
      body,
      idMapping,
    );

    try {
      const response = await sendRequest(
        { url, method: item.method, body: updatedBody },
        token,
      );

      if (response.ok) {
        if (
          item.method === "POST" &&
          item.url.includes("/training-executions/days")
        ) {
          const responseData = (await response.json()) as Record<
            string,
            unknown
          >;
          const realId = responseData?.id as string;
          const tempId = item.body?.tempId as string;
          if (realId && tempId) {
            idMapping[tempId] = realId;
            console.log(`🔗 Маппинг: ${tempId} → ${realId}`);
          }
        }
        success++;
        await removeFromQueue(item.id);
        console.log(`✅ Отправлено: ${item.method} ${url}`);
      } else {
        failed++;
        console.warn(`❌ Ошибка ${response.status}: ${item.method} ${url}`);
        if (response.status === 404 || response.status >= 500) {
          await removeFromQueue(item.id);
        }
      }
    } catch {
      failed++;
      console.error(`❌ Сеть недоступна: ${item.method} ${url}`);
    }
  }

  window.dispatchEvent(
    new CustomEvent("offline-queue-processed", { detail: { success, failed } }),
  );

  console.log(`📊 Результат: ${success} успешно, ${failed} неудачно`);
  return { success, failed };
}

export function initOfflineQueue(): void {
  if (navigator.onLine) {
    processQueue();
  }

  window.addEventListener("online", () => {
    console.log("🌐 Интернет появился — обрабатываем очередь");
    processQueue().then((result) => {
      if (result.success > 0) {
        import("react-hot-toast")
          .then(({ toast }) => {
            toast.success(`🔄 Синхронизировано: ${result.success} запросов`, {
              duration: 3000,
              position: "bottom-right",
            });
          })
          .catch(() => {});
      }
    });
  });

  window.addEventListener("offline", () => {
    console.log("📴 Интернет пропал — запросы будут в очереди");
  });
}
