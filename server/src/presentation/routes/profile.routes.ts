import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  ProfileController.getProfile.bind(ProfileController),
);
router.patch(
  "/update",
  authenticateToken,
  ProfileController.updateProfile.bind(ProfileController),
);

export default router;
