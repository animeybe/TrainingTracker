// shared/lib/offlineQueue.ts

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: Record<string, unknown> | null;
  timestamp: number;
}

const DB_NAME = "TrainingTrackerOffline";
const DB_VERSION = 1;
const STORE_NAME = "offline-queue";

// Открыть базу данных
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Добавить запрос в очередь
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

// Получить всю очередь
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

// Удалить один запрос
async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

// Очистить всю очередь
export async function clearQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Обработать очередь: отправить все накопленные запросы на сервер.
 * При успехе — показывает toast-уведомление.
 * Возвращает статистику: сколько успешно, сколько с ошибкой.
 */
export async function processQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const queue = await getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  console.log(`🔄 Обработка очереди: ${queue.length} запросов`);

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        success++;
        await removeFromQueue(item.id);
        console.log(`✅ Отправлено: ${item.method} ${item.url}`);

        // Toast-уведомление об успешной синхронизации
        try {
          const { toast } = await import("react-hot-toast");
          const action = item.method === "POST" ? "сохранена" : "обновлена";
          const resource = item.url.includes("training-executions")
            ? "Тренировка"
            : item.url.includes("favorites")
              ? "Избранное"
              : "Данные";
          toast.success(`✅ ${resource} ${action}`, {
            duration: 2500,
            position: "bottom-right",
          });
        } catch {
          console.warn("react-hot-toast не доступен");
        }
      } else {
        failed++;
        console.warn(
          `❌ Ошибка ${response.status}: ${item.method} ${item.url}`,
        );
      }
    } catch {
      failed++;
      console.error(`❌ Сеть недоступна: ${item.method} ${item.url}`);
    }
  }

  console.log(`📊 Результат: ${success} успешно, ${failed} неудачно`);

  return { success, failed };
}

// Запустить обработку очереди при появлении интернета
export function initOfflineQueue(): void {
  if (navigator.onLine) {
    processQueue();
  }

  window.addEventListener("online", () => {
    console.log("🌐 Интернет появился — обрабатываем очередь");
    processQueue().then((result) => {
      if (result.success > 0) {
        try {
          import("react-hot-toast").then(({ toast }) => {
            toast.success(`🔄 Синхронизировано: ${result.success} запросов`, {
              duration: 3000,
              position: "bottom-right",
            });
          });
        } catch {
          console.warn("react-hot-toast не доступен");
        }
      }
    });
  });

  window.addEventListener("offline", () => {
    console.log("📴 Интернет пропал — запросы будут в очереди");
  });
}
