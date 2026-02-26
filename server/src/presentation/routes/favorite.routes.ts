import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, FavoriteController.getFavorites);
router.post(
  "/:exerciseId/toggle",
  authenticateToken,
  FavoriteController.toggle,
);

export default router;
