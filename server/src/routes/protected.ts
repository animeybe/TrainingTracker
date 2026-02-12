import { Router } from "express";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/profile", authenticateToken, (req: any, res: any) => {
  res.json({
    id: req.user?.id,
    username: req.user?.username,
    message: "Профиль загружен",
  });
});

export default router;
