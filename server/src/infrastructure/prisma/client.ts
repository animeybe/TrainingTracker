import { PrismaClient } from "@prisma/client";
import { logger } from "../../common/utils/logger";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export const PrismaModule = {
  async init(): Promise<void> {
    await prisma.$connect();
    logger.info("✅ Prisma connected");
  },
  async close(): Promise<void> {
    await prisma.$disconnect();
  },
};
