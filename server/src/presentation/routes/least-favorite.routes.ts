import { Router } from "express";
import { LeastFavoriteController } from "../controllers/least-favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, LeastFavoriteController.getLeastFavorites);
router.post(
  "/:exerciseId/toggle",
  authenticateToken,
  LeastFavoriteController.toggle,
);

export default router;
