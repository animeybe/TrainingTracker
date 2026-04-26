// domain/services/push.service.ts
import webpush from "web-push";
import type {
  PushSubscriptionEntity,
  CreatePushSubscriptionEntity,
} from "../entities/push-subscription.entity";
import type { IPushSubscriptionRepository } from "../repositories/i-push-subscription.repository";

// Настройка VAPID (один раз при старте сервера)
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@trainingtk.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class PushService {
  constructor(private readonly pushRepo: IPushSubscriptionRepository) {}

  // Сохранить или обновить подписку
  async subscribe(
    entity: CreatePushSubscriptionEntity,
  ): Promise<PushSubscriptionEntity> {
    return await this.pushRepo.upsert(entity);
  }

  // Отписаться от уведомлений на конкретном устройстве
  async unsubscribe(endpoint: string): Promise<boolean> {
    return await this.pushRepo.deleteByEndpoint(endpoint);
  }

  // Отписаться от всех устройств (выход из аккаунта)
  async unsubscribeAll(userId: string): Promise<void> {
    await this.pushRepo.deleteAllByUserId(userId);
  }

  // Отправить уведомление одной подписке
  async sendToOne(
    subscription: PushSubscriptionEntity,
    payload: PushPayload,
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        },
        JSON.stringify(payload),
      );
      return true;
    } catch (error: any) {
      // Подписка больше не действительна — удалить из БД
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.pushRepo.deleteByEndpoint(subscription.endpoint);
      }
      console.error("Push failed:", error);
      return false;
    }
  }

  // Отправить уведомление всем устройствам пользователя
  async sendToUser(
    userId: string,
    payload: PushPayload,
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    const subscriptions = await this.pushRepo.findByUserId(userId);
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendToOne(sub, payload)),
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value,
    ).length;
    const failed = results.length - sent;

    console.log(
      `Push для пользователя ${userId}: отправлено ${sent}/${subscriptions.length}`,
    );

    return { total: subscriptions.length, sent, failed };
  }

  // Количество устройств пользователя
  async getDeviceCount(userId: string): Promise<number> {
    return await this.pushRepo.countByUserId(userId);
  }
}
