  // routes/plan.routes.ts

  import { Router } from "express";
  import { PlanController } from "../controllers/plan.controller";
  import { authenticateToken } from "../middleware/auth.middleware";

  const router = Router();
  const controller = new PlanController();

  // 1. Рекомендация сплита
  router.post(
    "/recommend",
    authenticateToken,
    controller.recommendSplit.bind(controller),
  );

  // 2. Генерация полного плана на неделю
  router.post(
    "/generate",
    authenticateToken,
    controller.generatePlan.bind(controller),
  );

  // 3. План на сегодня (с учётом wellbeing)
  router.post(
    "/today",
    authenticateToken,
    controller.getTodayAdjusted.bind(controller),
  );

  // 4. Список планов пользователя
  router.post(
    "/user-plans",
    authenticateToken,
    controller.getUserPlans.bind(controller),
  );

  // 5. Получить план на конкретную неделю
  router.get(
    "/:userId/:week",
    authenticateToken,
    controller.getPlan.bind(controller),
  );

  export default router;
