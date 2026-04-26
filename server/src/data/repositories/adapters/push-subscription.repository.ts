// data/repositories/adapters/push-subscription.repository.ts
import { PrismaPushSubscriptionRepository } from "../prisma/prisma-push-subscription.repository";
import { PushSubscriptionMapper } from "../../mappers/push-subscription.mapper";
import type {
  PushSubscriptionEntity,
  CreatePushSubscriptionEntity,
} from "../../../domain/entities/push-subscription.entity";
import type { IPushSubscriptionRepository } from "../../../domain/repositories";

export class PushSubscriptionRepositoryImpl implements IPushSubscriptionRepository {
  constructor(private readonly prismaRepo: PrismaPushSubscriptionRepository) {}

  async upsert(
    entity: CreatePushSubscriptionEntity,
  ): Promise<PushSubscriptionEntity> {
    const dto = PushSubscriptionMapper.fromCreateEntity(entity);
    const result = await this.prismaRepo.upsert(dto);
    return PushSubscriptionMapper.toEntity(result);
  }

  async findByUserId(userId: string): Promise<PushSubscriptionEntity[]> {
    const dtos = await this.prismaRepo.findByUserId(userId);
    return dtos.map(PushSubscriptionMapper.toEntity);
  }

  async findByEndpoint(
    endpoint: string,
  ): Promise<PushSubscriptionEntity | null> {
    const dto = await this.prismaRepo.findByEndpoint(endpoint);
    if (!dto) return null;
    return PushSubscriptionMapper.toEntity(dto);
  }

  async deleteByEndpoint(endpoint: string): Promise<boolean> {
    return await this.prismaRepo.deleteByEndpoint(endpoint);
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prismaRepo.deleteAllByUserId(userId);
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prismaRepo.countByUserId(userId);
  }
}
