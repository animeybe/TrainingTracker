// presentation/controllers/training-exercise-execution.controller.ts
import { Response } from "express";
import { TrainingExerciseExecutionService } from "../../domain/services/training-exercise-execution.service";
import type {
  TrainingExerciseExecutionEntity,
  CreateTrainingExerciseExecutionEntity,
} from "../../domain/entities/training-exercise-execution.entity";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { AuthRequest } from "../types";

export class TrainingExerciseExecutionController {
  private service: TrainingExerciseExecutionService;

  constructor() {
    this.service = container.get(
      ServiceKeys.TRAINING_EXERCISE_EXECUTION_SERVICE,
    );
  }

  async createExec(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateTrainingExerciseExecutionEntity[] = req.body;

      const results = await Promise.all(
        data.map(async (item) => {
          return await this.service.createExec(item);
        }),
      );

      res.status(201).json(results.filter(Boolean));
    } catch (error) {
      console.error("Create exercise executions error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  async updateExec(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: TrainingExerciseExecutionEntity = req.body;

      const result = await this.service.updateExec(id, data);
      if (!result) {
        res.status(404).json({ error: "Выполнение упражнения не найдено" });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Update exercise execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  async getExecsByDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const result = await this.service.findByExecutionId(executionId);
      res.json(result);
    } catch (error) {
      console.error("Get exercise executions error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}
