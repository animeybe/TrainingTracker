// presentation/controllers/push.controller.ts
import { Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { PushService } from "../../domain/services/push.service";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";

const pushService = container.get(ServiceKeys.PUSH_SERVICE) as PushService;

export class PushController {
  // POST /api/push/subscribe
  static async subscribe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const subscription = req.body; // { endpoint, keys: { p256dh, auth } }

      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        res.status(400).json({
          error:
            "Неверный формат подписки. Ожидается: { endpoint, keys: { p256dh, auth } }",
        });
        return;
      }

      const result = await pushService.subscribe({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });

      logger.info(
        `📱 Push-подписка создана: user=${userId}, endpoint=${subscription.endpoint.slice(0, 50)}...`,
      );
      res.status(201).json({ success: true, id: result.id });
    } catch (error: any) {
      logger.error(`Push subscribe failed: ${error.message}`);
      res.status(500).json({ error: "Не удалось сохранить подписку" });
    }
  }

  // POST /api/push/unsubscribe
  static async unsubscribe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        res.status(400).json({ error: "Не указан endpoint" });
        return;
      }

      await pushService.unsubscribe(endpoint);
      logger.info(`📱 Push-подписка удалена: ${endpoint.slice(0, 50)}...`);
      res.json({ success: true });
    } catch (error: any) {
      logger.error(`Push unsubscribe failed: ${error.message}`);
      res.status(500).json({ error: "Не удалось удалить подписку" });
    }
  }

  // POST /api/push/unsubscribe-all (выход из аккаунта)
  static async unsubscribeAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      await pushService.unsubscribeAll(userId);
      logger.info(`📱 Все push-подписки удалены для user=${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      logger.error(`Push unsubscribeAll failed: ${error.message}`);
      res.status(500).json({ error: "Не удалось удалить подписки" });
    }
  }

  // GET /api/push/count — количество устройств
  static async getDeviceCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const count = await pushService.getDeviceCount(userId);
      res.json({ count });
    } catch (error: any) {
      logger.error(`Push count failed: ${error.message}`);
      res
        .status(500)
        .json({ error: "Не удалось получить количество устройств" });
    }
  }
}
