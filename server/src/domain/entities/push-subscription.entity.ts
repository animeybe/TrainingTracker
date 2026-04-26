// domain/entities/push-subscription.entity.ts

export type PushSubscriptionEntity = {
  id: number;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePushSubscriptionEntity = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type UpdatePushSubscriptionEntity = Partial<
  Pick<PushSubscriptionEntity, "p256dh" | "auth">
>;
