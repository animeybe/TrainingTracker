// api/pushApi.ts
import { apiRequest } from "./index";
import type {
  PushSubscriptionData,
  PushSubscribeResponse,
  PushDeviceCountResponse,
} from "./types";

export const pushApi = {
  // POST /api/push/subscribe — сохранить подписку
  subscribe: (
    subscription: PushSubscriptionData,
  ): Promise<PushSubscribeResponse> =>
    apiRequest("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    }),

  // POST /api/push/unsubscribe — удалить конкретную подписку
  unsubscribe: (endpoint: string): Promise<{ success: boolean }> =>
    apiRequest("/push/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    }),

  // POST /api/push/unsubscribe-all — удалить все подписки (при логауте)
  unsubscribeAll: (): Promise<{ success: boolean }> =>
    apiRequest("/push/unsubscribe-all", {
      method: "POST",
    }),

  // GET /api/push/count — количество устройств
  getDeviceCount: (): Promise<PushDeviceCountResponse> =>
    apiRequest("/push/count"),
};
