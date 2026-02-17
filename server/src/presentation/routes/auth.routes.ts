import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import {
  validateRegister,
  validateLogin,
} from "../../common/utils/validators";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/roles.middleware";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", authenticateToken, requireUser, getMe);

export default router;
