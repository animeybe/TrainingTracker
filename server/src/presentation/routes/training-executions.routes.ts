// routes/training-executions.routes.ts
import { Router } from "express";
import { TrainingDayExecutionController } from "../controllers/training-day-execution.controller";
import { TrainingExerciseExecutionController } from "../controllers/training-exercise-execution.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

const dayController = new TrainingDayExecutionController();
const exerciseController = new TrainingExerciseExecutionController();

// ─── Дни тренировок ─────────────────────────────────

// Получить все дни пользователя
router.get("/days/user", authenticateToken, (req, res) =>
  dayController.getAllUserDays(req as any, res),
);

// Получить день по week + dayOfWeek
router.get("/days", authenticateToken, (req, res) =>
  dayController.getDayByWeekDay(req as any, res),
);

// Получить все дни за неделю
router.get("/days/week/:week", authenticateToken, (req, res) =>
  dayController.getDaysByUserWeek(req as any, res),
);

// Получить день по ID
router.get("/days/:id", authenticateToken, (req, res) =>
  dayController.getDayById(req as any, res),
);

// Начать тренировку
router.post("/days", authenticateToken, (req, res) =>
  dayController.startTraining(req as any, res),
);

// Обновить день
router.put("/days/:id", authenticateToken, (req, res) =>
  dayController.updateDay(req as any, res),
);

// Завершить тренировку
router.put("/days/:id/finish", authenticateToken, (req, res) =>
  dayController.finishTraining(req as any, res),
);

// ─── Упражнения ─────────────────────────────────────

// Добавить упражнения (одно или массив)
router.post("/exercises", authenticateToken, (req, res) =>
  exerciseController.addExercises(req as any, res),
);

// Обновить упражнение
router.put("/exercises/:id", authenticateToken, (req, res) =>
  exerciseController.updateExercise(req as any, res),
);

// Получить упражнение по ID
router.get("/exercises/:id", authenticateToken, (req, res) =>
  exerciseController.getExerciseById(req as any, res),
);

// Получить упражнения за день
router.get("/exercises/day/:executionId", authenticateToken, (req, res) =>
  exerciseController.getExercisesByDay(req as any, res),
);

export default router;
