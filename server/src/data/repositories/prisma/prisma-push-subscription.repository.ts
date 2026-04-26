// data/repositories/prisma/prisma-push-subscription.repository.ts
import { prisma } from "../../../infrastructure/prisma/client";
import type {
  PushSubscriptionDto,
  CreatePushSubscriptionDto,
} from "../../dtos/push-subscription.prisma-dto";

export class PrismaPushSubscriptionRepository {
  // Создать подписку. Если endpoint уже существует — обновить
  async upsert(data: CreatePushSubscriptionDto): Promise<PushSubscriptionDto> {
    return await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: data.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
      },
      update: {
        p256dh: data.p256dh,
        auth: data.auth,
        userId: data.userId, // на случай перепривязки к другому пользователю
      },
    });
  }

  async findByUserId(userId: string): Promise<PushSubscriptionDto[]> {
    return await prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscriptionDto | null> {
    return await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
  }

  async deleteByEndpoint(endpoint: string): Promise<boolean> {
    try {
      await prisma.pushSubscription.delete({ where: { endpoint } });
      return true;
    } catch {
      return false;
    }
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({ where: { userId } });
  }

  async countByUserId(userId: string): Promise<number> {
    return await prisma.pushSubscription.count({ where: { userId } });
  }
}
