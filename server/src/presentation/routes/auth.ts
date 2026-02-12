import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateRegister, validateLogin } from "../../utils/validators";

const router = Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);

export default router;
