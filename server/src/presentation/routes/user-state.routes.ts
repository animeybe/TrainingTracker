// routes/user-state.routes.ts
import { Router } from "express";
import { UserStateController } from "../controllers/user-state.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, UserStateController.getCurrentWeek);
router.post("/week", authenticateToken, UserStateController.updateCurrentWeek);

export default router;
