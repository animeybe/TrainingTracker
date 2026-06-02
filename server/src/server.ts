// server.ts
// ═══════════════════════════════════════════════════════════════
// Точка входа сервера TrainingTracker
//
// Порядок middleware:
//   1. Безопасность (helmet, cors)
//   2. Парсинг тела запроса
//   3. Rate limiting (отдельно для auth и API)
//   4. Управление кэшированием (Cache-Control заголовки)
//   5. API-маршруты
//   6. Обработка ошибок (404 и глобальная)
// ═══════════════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import https from "https";
import fs from "fs";
import { logger } from "./common/utils";
import apiRouter from "./presentation/routes";
import { container, ServiceKeys } from "./infrastructure/di/container";

// ═══════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ
// ═══════════════════════════════════════════════════════════════

const PORT = parseInt(process.env.PORT || "3001", 10);

/** Разрешённые источники для CORS */
const ALLOWED_ORIGINS = [
  "https://localhost:5173",
  "https://trainingtracker.ru",
  "https://www.trainingtracker.ru",
];

// Rate limiting: значения из .env или по умолчанию
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 минут
const RATE_LIMIT_AUTH_MAX =
  parseInt(process.env.RATE_LIMIT_AUTH_MAX || "1000", 10);
const RATE_LIMIT_API_MAX =
  parseInt(process.env.RATE_LIMIT_API_MAX || "1000", 10);

// ═══════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ EXPRESS
// ═══════════════════════════════════════════════════════════════

const app = express();

// ── Безопасность ────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ── Парсинг тела запроса ────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ── Rate limiting ───────────────────────────────────────────
const createRateLimiter = (max: number) =>
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    message: {
      error: "Слишком много запросов. Попробуйте позже.",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Пропускаем localhost для удобства разработки
    skip: (req) =>
      ["127.0.0.1", "::1", "localhost"].includes(req.ip || ""),
  });

// Более строгий лимит для auth (логин/регистрация)
app.use("/api/auth", createRateLimiter(RATE_LIMIT_AUTH_MAX));
// Общий лимит для всех API-запросов
app.use("/api", createRateLimiter(RATE_LIMIT_API_MAX));

// ═══════════════════════════════════════════════════════════════
// УПРАВЛЕНИЕ КЭШИРОВАНИЕМ (Cache-Control)
// ═══════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  const { path } = req;

  // Статические файлы (фронт): кэшируем агрессивно
  if (!path.startsWith("/api")) {
    res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  }
  // API: GET — короткий кэш для офлайн-доступа через SW
  else if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=300");
  }
  // API: мутации (POST/PUT/DELETE) — не кэшируем
  else {
    res.set("Cache-Control", "no-store");
  }

  next();
});

// ═══════════════════════════════════════════════════════════════
// МАРШРУТЫ
// ═══════════════════════════════════════════════════════════════

app.use("/api", apiRouter);

// ═══════════════════════════════════════════════════════════════
// ОБРАБОТКА ОШИБОК
// ═══════════════════════════════════════════════════════════════

// 404 — маршрут не найден
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Глобальный обработчик ошибок (логирует всё, клиенту отдаёт 500)
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`Unhandled error: ${error.message}`, {
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
    });
    res.status(500).json({
      error: "Внутренняя ошибка сервера. Попробуйте позже.",
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ЗАПУСК СЕРВЕРА
// ═══════════════════════════════════════════════════════════════

// HTTPS — если есть сертификаты, иначе HTTP
let server: https.Server | express.Express;
if (fs.existsSync("./localhost-key.pem") && fs.existsSync("./localhost.pem")) {
  const options = {
    key: fs.readFileSync("./localhost-key.pem"),
    cert: fs.readFileSync("./localhost.pem"),
  };
  server = https.createServer(options, app);
  logger.info("✅ Запуск сервера по HTTPS");
} else {
  server = app;
  logger.info("⚠️ Сертификаты не найдены, запуск по HTTP");
}

// Запускаем фоновые задачи (крон очистки и напоминаний)
container.get(ServiceKeys.TRAINING_CLEANUP_SERVICE);

server.listen(PORT, "0.0.0.0", () => {
  logger.info(
    `🚀 Server running: ${server === app ? "http" : "https"}://localhost:${PORT}`,
  );
  logger.info(
    `📊 Rate limits: auth=${RATE_LIMIT_AUTH_MAX}/15m, api=${RATE_LIMIT_API_MAX}/15m`,
  );
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN — корректное завершение при SIGTERM/SIGINT
// ═══════════════════════════════════════════════════════════════

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received — shutting down gracefully");
  process.exit(0);
});

// Ловим необработанные ошибки, чтобы сервер не падал молча
process.on("uncaughtException", (error) => {
  logger.error(`UNCAUGHT EXCEPTION: ${error.message}`, {
    stack: error.stack,
  });
  // Не завершаем процесс — пусть работает, но логируем
});

process.on("unhandledRejection", (reason) => {
  logger.error(`UNHANDLED REJECTION: ${reason}`);
});
