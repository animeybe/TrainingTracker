import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateAccountController,
} from "../controllers/auth.controller";
import { validateRegister, validateLogin } from "../../common/utils/validators";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", authenticateToken, getMe);
router.patch("/account", authenticateToken, updateAccountController);

export default router;
