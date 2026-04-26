// presentation/controllers/training-exercise-execution.controller.ts
import { Response } from "express";
import { TrainingExerciseExecutionService } from "../../domain/services/training-exercise-execution.service";
import type {
  CreateTrainingExerciseExecutionEntity,
  UpdateTrainingExerciseExecutionEntity,
} from "../../domain/entities/training-exercise-execution.entity";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";

export class TrainingExerciseExecutionController {
  private service: TrainingExerciseExecutionService;

  constructor() {
    this.service = container.get(
      ServiceKeys.TRAINING_EXERCISE_EXECUTION_SERVICE,
    );
  }

  // POST /api/training-executions/exercises
  // Принимает как одиночный объект, так и массив
  async addExercises(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body;

      // Если массив — создаём несколько
      if (Array.isArray(data)) {
        const results = await Promise.all(
          data.map((item: CreateTrainingExerciseExecutionEntity) =>
            this.service.addExercise(item),
          ),
        );
        res.status(201).json(results.filter(Boolean));
        return;
      }

      // Одиночный объект
      const result = await this.service.addExercise(data);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error("Create exercise executions error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // PUT /api/training-executions/exercises/:id
  async updateExercise(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateTrainingExerciseExecutionEntity = req.body;

      const result = await this.service.update(id, data);
      if (!result) {
        res.status(404).json({ error: "Выполнение упражнения не найдено" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Update exercise execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/exercises/:id
  async getExerciseById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      if (!result) {
        res.status(404).json({ error: "Выполнение упражнения не найдено" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Get exercise execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/exercises/day/:executionId
  async getExercisesByDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      const result = await this.service.findByExecutionId(executionId);
      res.json(result);
    } catch (error: any) {
      logger.error("Get exercises by day error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}
