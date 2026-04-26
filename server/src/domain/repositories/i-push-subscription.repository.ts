// domain/repositories/i-push-subscription.repository.ts
import type {
  PushSubscriptionEntity,
  CreatePushSubscriptionEntity,
} from "../entities/push-subscription.entity";

export interface IPushSubscriptionRepository {
  // Создать или обновить подписку (один endpoint — одна подписка)
  upsert(entity: CreatePushSubscriptionEntity): Promise<PushSubscriptionEntity>;

  // Все подписки пользователя (разные устройства)
  findByUserId(userId: string): Promise<PushSubscriptionEntity[]>;

  // Найти подписку по endpoint (для проверки существования)
  findByEndpoint(endpoint: string): Promise<PushSubscriptionEntity | null>;

  // Удалить конкретную подписку (пользователь отписался на устройстве)
  deleteByEndpoint(endpoint: string): Promise<boolean>;

  // Удалить все подписки пользователя (при выходе из аккаунта)
  deleteAllByUserId(userId: string): Promise<void>;

  // Количество устройств пользователя
  countByUserId(userId: string): Promise<number>;
}
