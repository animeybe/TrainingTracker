import { Router, Request, Response, NextFunction } from "express";
import { TrainingDayExecutionController } from "../controllers/training-day-execution.controller";
import { TrainingExerciseExecutionController } from "../controllers/training-exercise-execution.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

console.log("🚀 Training routes file LOADED");

const dayController = new TrainingDayExecutionController();
const exerciseController = new TrainingExerciseExecutionController();

// 1. GET /days с query‑параметрами
router.get(
  "/days",
  authenticateToken,
  dayController.getDayByWeekDayDate.bind(dayController),
);

// 2. GET /days/week/:week
router.get(
  "/days/week/:week",
  authenticateToken,
  dayController.getDaysByUserWeek.bind(dayController),
);

// 3. POST /days
router.post(
  "/days",
  authenticateToken,
  dayController.createDay.bind(dayController),
);

// 4. PUT /days/:id
router.put(
  "/days/:id",
  authenticateToken,
  dayController.updateDay.bind(dayController),
);

// 5. Упражнения
router.post(
  "/exercises",
  authenticateToken,
  exerciseController.createExec.bind(exerciseController),
);

router.put(
  "/exercises/:id",
  authenticateToken,
  exerciseController.updateExec.bind(exerciseController),
);

router.get(
  "/exercises/day/:executionId",
  authenticateToken,
  exerciseController.getExecsByDay.bind(exerciseController),
);

console.log("✅ ALL training routes REGISTERED");

export default router;
