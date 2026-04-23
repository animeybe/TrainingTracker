// presentation/controllers/training-day-execution.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { TrainingDayExecutionService } from "../../domain/services/training-day-execution.service";
import type {
  TrainingDayExecutionEntity,
  CreateTrainingDayExecutionEntity,
} from "../../domain/entities/training-day-execution.entity";

// Расширяем тип Request
interface AuthRequest extends Request {
  userId?: string;
}

export class TrainingDayExecutionController {
  private service: TrainingDayExecutionService;

  constructor() {
    this.service = container.get(ServiceKeys.TRAINING_DAY_EXECUTION_SERVICE);
  }

  async createDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // используем userId из middleware
      const data: CreateTrainingDayExecutionEntity = {
        userId,
        ...req.body,
      };

      const result = await this.service.createDay(data);
      if (!result) {
        res.status(400).json({ error: "Не удалось создать выполнение дня" });
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Create day execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  async updateDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: TrainingDayExecutionEntity = req.body;

      const result = await this.service.updateDay(id, data);
      if (!result) {
        res.status(404).json({ error: "Выполнение дня не найдено" });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Update day execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  async getDayByWeekDayDate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const week = req.query.week as string;
      const dayOfWeekParam = req.query.dayOfWeek as string;
      const executionDate = req.query.executionDate as string;

      if (!week || !dayOfWeekParam || !executionDate) {
        res.status(400).json({
          error: "Missing params: week, dayOfWeek, executionDate",
        });
        return;
      }

      const result = await this.service.findByWeekDayDateAndUser(
        userId,
        parseInt(week),
        parseInt(dayOfWeekParam),
        new Date(executionDate),
      );

      if (!result) {
        res.status(404).json({ error: "Выполнение дня не найдено" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Get day execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  async getDaysByUserWeek(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { week } = req.params;

      const result = await this.service.findByUserAndWeek(
        userId,
        parseInt(week),
      );

      res.json(result);
    } catch (error) {
      console.error("Get week executions error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}
