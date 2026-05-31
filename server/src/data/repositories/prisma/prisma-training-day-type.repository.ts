import { prisma } from "../../../infrastructure/prisma/client";
import type { TrainingDayTypeDto, CreateTrainingDayTypeDto } from "../../dtos/training-day-type.prisma-dto";

export class PrismaTrainingDayTypeRepository {
  async create(data: CreateTrainingDayTypeDto): Promise<TrainingDayTypeDto> {
    return await prisma.trainingDayType.create({ data });
  }

  async update(id: string, data: { dayType?: string }): Promise<TrainingDayTypeDto | null> {
    return await prisma.trainingDayType.update({ where: { id }, data });
  }

  async findById(id: string): Promise<TrainingDayTypeDto | null> {
    return await prisma.trainingDayType.findUnique({ where: { id } });
  }

  async findByPlanId(planId: string): Promise<TrainingDayTypeDto[]> {
    return await prisma.trainingDayType.findMany({ where: { planId } });
  }

  async findByPlanIdAndDay(planId: string, dayOfWeek: number): Promise<TrainingDayTypeDto | null> {
    return await prisma.trainingDayType.findUnique({
      where: { planId_dayOfWeek: { planId, dayOfWeek } },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.trainingDayType.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async upsert(planId: string, dayOfWeek: number, dayType: string): Promise<TrainingDayTypeDto> {
    return await prisma.trainingDayType.upsert({
      where: { planId_dayOfWeek: { planId, dayOfWeek } },
      create: { planId, dayOfWeek, dayType },
      update: { dayType },
    });
  }
}
