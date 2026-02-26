import { Router } from "express";
import { ExerciseController } from "../controllers/exercise.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", ExerciseController.getAll);
router.get("/muscle/:muscle", ExerciseController.getByMuscleGroup);
router.get("/search", ExerciseController.search);

router.get("/recommended", authenticateToken, ExerciseController.search);

export default router;
