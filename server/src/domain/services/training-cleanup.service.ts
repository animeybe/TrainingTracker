// domain/services/training-cleanup.service.ts
import cron from "node-cron";
import { logger } from "../../common/utils";
import type { ITrainingDayExecutionRepository } from "../repositories/i-training-day-execution.repository";
import { PushService } from "./push.service";
import { container, ServiceKeys } from "../../infrastructure/di/container";

export class TrainingCleanupService {
  private pushService: PushService;

  constructor(
    private readonly trainingDayRepo: ITrainingDayExecutionRepository,
  ) {
    this.pushService = container.get(ServiceKeys.PUSH_SERVICE) as PushService;
  }

  start(): void {
    // Очистка зависших тренировок (каждые 30 минут)
    cron.schedule("*/30 * * * *", async () => {
      await this.cleanup();
    });
    this.cleanup();

    // Напоминания о незавершённых тренировках (каждые 30 минут)
    cron.schedule("*/30 * * * *", async () => {
      await this.sendReminders();
    });

    logger.info("🧹 Training cleanup & reminders cron started (every 30 min)");
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
        `🧹 Cleaned up ${abandoned.length} abandoned training(s)`,
      );
    } catch (error: any) {
      logger.error(`Training cleanup failed: ${error.message}`);
    }
  }

  private async sendReminders(): Promise<void> {
    try {
      const now = Date.now();
      const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);
      const fourHoursAgoMinus15min = new Date(now - 4.25 * 60 * 60 * 1000);
      const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);
      const sixHoursAgoMinus15min = new Date(now - 6.25 * 60 * 60 * 1000);

      // Тренировки, начатые 3:45–4:00 часа назад (напоминание на 4 часа)
      const remindAt4h = await this.trainingDayRepo.findActiveBetween(
        fourHoursAgoMinus15min,
        fourHoursAgo,
      );

      // Тренировки, начатые 5:45–6:00 часов назад (напоминание на 6 часов)
      const remindAt6h = await this.trainingDayRepo.findActiveBetween(
        sixHoursAgoMinus15min,
        sixHoursAgo,
      );

      for (const training of remindAt4h) {
        await this.pushService.sendToUser(training.userId, {
          title: "🏋️ Как тренировка?",
          body: "Вы уже закончили? Не забудьте записать результаты!",
          url: "/records",
          tag: "training-reminder-4h",
          requireInteraction: false,
        });
      }

      for (const training of remindAt6h) {
        await this.pushService.sendToUser(training.userId, {
          title: "⚠️ Тренировка не завершена",
          body: "Завершите сегодняшнюю тренировку, иначе данные о ней пропадут через 6 часов",
          url: "/records",
          tag: "training-reminder-6h",
          requireInteraction: true,
        });
      }

      if (remindAt4h.length > 0 || remindAt6h.length > 0) {
        logger.info(
          `🔔 Reminders sent: 4h=${remindAt4h.length}, 6h=${remindAt6h.length}`,
        );
      }
    } catch (error: any) {
      logger.error(`Reminder sending failed: ${error.message}`);
    }
  }
}
