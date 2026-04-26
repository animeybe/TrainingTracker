// routes/plan.routes.ts
import { Router } from "express";
import { PlanController } from "../controllers/plan.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
const controller = new PlanController();

router.post("/recommend", authenticateToken, (req, res) =>
  controller.recommendSplit(req as any, res),
);

router.post("/generate", authenticateToken, (req, res) =>
  controller.generatePlan(req as any, res),
);

router.post("/today", authenticateToken, (req, res) =>
  controller.getTodayAdjusted(req as any, res),
);

router.post("/user-plans", authenticateToken, (req, res) =>
  controller.getUserPlans(req as any, res),
);

router.get("/:userId/:week", authenticateToken, (req, res) =>
  controller.getPlan(req as any, res),
);

router.get("/max-week", authenticateToken, (req, res) =>
  controller.getMaxWeekForUser(req as any, res),
);

export default router;
