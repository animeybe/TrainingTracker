// routes/profile.routes.ts
import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// GET /profile (без /api в пути, он уже в apiRouter)
router.get(
  "/",
  authenticateToken,
  ProfileController.getProfile.bind(ProfileController),
);

// PATCH /profile
router.patch(
  "/",
  authenticateToken,
  ProfileController.updateProfile.bind(ProfileController),
);

export default router;
