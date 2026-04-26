// presentation/controllers/training-day-execution.controller.ts
import { Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { TrainingDayExecutionService } from "../../domain/services/training-day-execution.service";
import type {
  CreateTrainingDayExecutionEntity,
  UpdateTrainingDayExecutionEntity,
} from "../../domain/entities/training-day-execution.entity";
import { AuthRequest } from "../types/auth.types";
import { logger } from "../../common/utils";

export class TrainingDayExecutionController {
  private service: TrainingDayExecutionService;

  constructor() {
    this.service = container.get(ServiceKeys.TRAINING_DAY_EXECUTION_SERVICE);
  }

  // POST /api/training-executions/days
  async startTraining(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { week, dayOfWeek, wellbeingToday, notes, startTime } = req.body;

      if (week == null || dayOfWeek == null) {
        res.status(400).json({ error: "week и dayOfWeek обязательны" });
        return;
      }

      const data: CreateTrainingDayExecutionEntity = {
        userId,
        week,
        dayOfWeek,
        startTime: startTime ? new Date(startTime) : new Date(),
        wellbeingToday: wellbeingToday ?? "NORMAL",
        notes: notes ?? null,
      };

      const result = await this.service.startTraining(data);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error("Start training error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // PUT /api/training-executions/days/:id/finish
  async finishTraining(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.finishTraining(id);

      if (!result) {
        res.status(404).json({ error: "Тренировка не найдена" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Finish training error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // PUT /api/training-executions/days/:id
  async updateDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateTrainingDayExecutionEntity = req.body;

      const result = await this.service.update(id, data);
      if (!result) {
        res.status(404).json({ error: "Тренировка не найдена" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Update day execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/days/:id
  async getDayById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      if (!result) {
        res.status(404).json({ error: "Тренировка не найдена" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Get day execution error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/days?week=1&dayOfWeek=2
  async getDayByWeekDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const week = parseInt(req.query.week as string);
      const dayOfWeek = parseInt(req.query.dayOfWeek as string);

      if (isNaN(week) || isNaN(dayOfWeek)) {
        res.status(400).json({ error: "week и dayOfWeek обязательны (числа)" });
        return;
      }

      const result = await this.service.findByWeekDayAndUser(
        userId,
        week,
        dayOfWeek,
      );

      if (!result) {
        res.status(404).json({ error: "Тренировка не найдена" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      logger.error("Get day by week/day error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/days/week/:week
  async getDaysByUserWeek(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const week = parseInt(req.params.week);

      if (isNaN(week)) {
        res.status(400).json({ error: "week должен быть числом" });
        return;
      }

      const result = await this.service.findByUserAndWeek(userId, week);
      res.json(result);
    } catch (error: any) {
      logger.error("Get week executions error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // GET /api/training-executions/days/user
  async getAllUserDays(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const result = await this.service.findByUserId(userId);
      res.json(result);
    } catch (error: any) {
      logger.error("Get all user days error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}
