// domain/services/training-cleanup.service.ts
import cron from "node-cron";
import { logger } from "../../common/utils";
import type { ITrainingDayExecutionRepository } from "../repositories/i-training-day-execution.repository";

export class TrainingCleanupService {
  constructor(
    private readonly trainingDayRepo: ITrainingDayExecutionRepository
  ) {}

  start(): void {
    // Каждые 30 минут
    cron.schedule("*/30 * * * *", async () => {
      await this.cleanup();
    });

    // И сразу при старте
    this.cleanup();

    logger.info("🧹 Training cleanup cron started (every 30 min)");
  }

  private async cleanup(): Promise<void> {
    try {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const abandoned = await this.trainingDayRepo.findAbandoned(twelveHoursAgo);

      if (abandoned.length === 0) return;

      for (const training of abandoned) {
        await this.trainingDayRepo.delete(training.id);
      }

      logger.info(
        `🧹 Cleaned up ${abandoned.length} abandoned training(s): ${abandoned.map(t => t.id).join(", ")}`
      );
    } catch (error: any) {
      logger.error(`Training cleanup failed: ${error.message}`);
    }
  }
}