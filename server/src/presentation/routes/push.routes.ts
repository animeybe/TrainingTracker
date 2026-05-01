// presentation/routes/push.routes.ts
import { Router } from "express";
import { PushController } from "../controllers/push.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Сохранить/обновить подписку
router.post("/subscribe", authenticateToken, PushController.subscribe);

// Удалить конкретную подписку
router.post("/unsubscribe", authenticateToken, PushController.unsubscribe);

// Удалить все подписки пользователя (при логауте)
router.post(
  "/unsubscribe-all",
  authenticateToken,
  PushController.unsubscribeAll,
);

// Количество устройств
router.get("/count", authenticateToken, PushController.getDeviceCount);

// ТЕСТ
router.post("/test", authenticateToken, PushController.sendTest);

export default router;
