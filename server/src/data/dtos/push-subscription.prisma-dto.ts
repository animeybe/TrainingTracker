// data/dtos/push-subscription.prisma-dto.ts

export type PushSubscriptionDto = {
  id: number;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePushSubscriptionDto = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type UpdatePushSubscriptionDto = {
  p256dh?: string;
  auth?: string;
};
