import { Router } from "express";
import { PlanController } from "../controllers/plan.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
const controller = new PlanController();

router.post(
  "/recommend",
  authenticateToken,
  controller.recommendSplit.bind(controller),
);
router.post(
  "/generate",
  authenticateToken,
  controller.generatePlan.bind(controller),
);
router.post(
  "/today",
  authenticateToken,
  controller.getTodayAdjusted.bind(controller),
);

export default router;
