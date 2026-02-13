import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateRegister, validateLogin } from "../../utils/validators";
import { authenticateToken } from "../middleware/auth";
import { requireUser, requireAdmin } from "../middleware/roles";
import path from "path";

const router = Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.get("/profile", authenticateToken, AuthController.getProfile);

// роуты с защитой
router.get("/dashboard", authenticateToken, requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../dist/index.html"));
});

router.get("/exercise-base", authenticateToken, requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../dist/index.html"));
});

router.get("/admin", authenticateToken, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../dist/index.html"));
});

// Все остальные роуты
router.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../dist/index.html"));
});

export default router;
