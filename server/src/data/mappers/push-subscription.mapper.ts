// data/mappers/push-subscription.mapper.ts
import type {
  PushSubscriptionDto,
  CreatePushSubscriptionDto,
} from "../dtos/push-subscription.prisma-dto";
import type {
  PushSubscriptionEntity,
  CreatePushSubscriptionEntity,
} from "../../domain/entities/push-subscription.entity";

export class PushSubscriptionMapper {
  static toEntity(dto: PushSubscriptionDto): PushSubscriptionEntity {
    return {
      id: dto.id,
      userId: dto.userId,
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      auth: dto.auth,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toDto(entity: PushSubscriptionEntity): PushSubscriptionDto {
    return {
      id: entity.id,
      userId: entity.userId,
      endpoint: entity.endpoint,
      p256dh: entity.p256dh,
      auth: entity.auth,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromCreateEntity(
    entity: CreatePushSubscriptionEntity,
  ): CreatePushSubscriptionDto {
    return {
      userId: entity.userId,
      endpoint: entity.endpoint,
      p256dh: entity.p256dh,
      auth: entity.auth,
    };
  }
}
