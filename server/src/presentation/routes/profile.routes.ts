import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/roles.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireUser,
  ProfileController.getProfile.bind(ProfileController),
);
router.patch(
  "/update",
  authenticateToken,
  requireUser,
  ProfileController.updateProfile.bind(ProfileController),
);

export default router;
