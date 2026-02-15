import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/roles.middleware";

const router = Router();

router.post(
  "/:exerciseId/toggle",
  authenticateToken,
  requireUser,
  FavoriteController.toggle,
);
router.get(
  "/",
  authenticateToken,
  requireUser,
  FavoriteController.getFavorites,
);

export default router;
